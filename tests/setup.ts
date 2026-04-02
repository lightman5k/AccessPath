import { afterEach, beforeEach, vi } from "vitest";

process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-auth-secret";
process.env.AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "accesspath_test_session";
process.env.AUTH_TRUST_PROXY = process.env.AUTH_TRUST_PROXY ?? "false";

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
