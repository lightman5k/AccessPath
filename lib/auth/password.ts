import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { PasswordHashVersion } from "@/types";

const PASSWORD_HASH_VERSION: PasswordHashVersion = "scrypt:v1";
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_SALT_BYTES = 16;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024,
} as const;
const FALLBACK_SALT = Buffer.from("accesspath-demo-salt", "utf8");

async function derivePasswordKey(password: string, salt: Buffer) {
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(Buffer.from(derivedKey));
    });
  });

  return derived;
}

function parseStoredPasswordHash(storedHash: string) {
  const parts = storedHash.split(":");
  if (parts.length !== 4) return null;

  const version = `${parts[0]}:${parts[1]}` as PasswordHashVersion;
  if (version !== PASSWORD_HASH_VERSION) return null;

  try {
    return {
      version,
      salt: Buffer.from(parts[2], "base64url"),
      hash: Buffer.from(parts[3], "base64url"),
    };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const derivedKey = await derivePasswordKey(password, salt);
  return `${PASSWORD_HASH_VERSION}:${salt.toString("base64url")}:${derivedKey.toString("base64url")}`;
}

export async function simulatePasswordVerification(password: string) {
  await derivePasswordKey(password, FALLBACK_SALT);
}

export async function verifyPassword(password: string, storedHash: string) {
  const parsedHash = parseStoredPasswordHash(storedHash);
  if (!parsedHash) {
    await simulatePasswordVerification(password);
    return false;
  }

  const derivedKey = await derivePasswordKey(password, parsedHash.salt);
  if (derivedKey.length !== parsedHash.hash.length) return false;
  return timingSafeEqual(derivedKey, parsedHash.hash);
}
