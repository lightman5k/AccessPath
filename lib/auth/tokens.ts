import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { getAuthSecret } from "./config";

const SESSION_TOKEN_BYTES = 32;

export function createRecordId() {
  return randomUUID();
}

export function createSessionToken() {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHmac("sha256", getAuthSecret()).update(token).digest("base64url");
}
