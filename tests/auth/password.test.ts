import { describe, expect, it } from "vitest";
import {
  hashPassword,
  simulatePasswordVerification,
  verifyPassword,
} from "@/lib/auth/password";

describe("password utilities", () => {
  it("hashes and verifies a valid password", async () => {
    const password = "SecurePassword123";
    const hash = await hashPassword(password);

    expect(hash).toMatch(/^scrypt:v1:[A-Za-z0-9\-_]+:[A-Za-z0-9\-_]+$/);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("SecurePassword123");

    await expect(verifyPassword("WrongPassword123", hash)).resolves.toBe(false);
  });

  it("fails safely for malformed hashes", async () => {
    await expect(verifyPassword("SecurePassword123", "not-a-real-hash")).resolves.toBe(false);
  });

  it("supports simulated verification without throwing", async () => {
    await expect(simulatePasswordVerification("SecurePassword123")).resolves.toBeUndefined();
  });
});
