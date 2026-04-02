import { describe, expect, it } from "vitest";
import { createRecordId, createSessionToken, hashSessionToken } from "@/lib/auth/tokens";

describe("token utilities", () => {
  it("creates unique record ids", () => {
    const first = createRecordId();
    const second = createRecordId();

    expect(first).not.toBe(second);
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("creates opaque session tokens", () => {
    const first = createSessionToken();
    const second = createSessionToken();

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(first.length).toBeGreaterThan(20);
  });

  it("hashes session tokens deterministically", () => {
    const token = createSessionToken();

    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toBe(token);
    expect(hashSessionToken(token)).not.toBe(hashSessionToken(`${token}-other`));
  });
});
