import { describe, expect, it, vi } from "vitest";
import { AuthService, createUnauthenticatedSession } from "@/lib/auth/service";
import { hashPassword } from "@/lib/auth/password";
import { hashSessionToken } from "@/lib/auth/tokens";
import type { StoredSession, StoredUser } from "@/types";
import {
  InMemorySessionRepository,
  InMemoryUserRepository,
} from "../helpers/in-memory-auth-repos";

async function createStoredUser(overrides: Partial<StoredUser> = {}): Promise<StoredUser> {
  const nowIso = "2026-03-24T12:00:00.000Z";

  return {
    id: "user-1",
    email: "admin@example.com",
    emailNormalized: "admin@example.com",
    fullName: "Admin User",
    companyName: "AccessPath",
    passwordHash: await hashPassword("SecurePassword123"),
    role: "admin",
    plan: "free",
    trialEndsAt: "2026-04-07T12:00:00.000Z",
    status: "active",
    createdAt: nowIso,
    updatedAt: nowIso,
    ...overrides,
  };
}

function createStoredSession(overrides: Partial<StoredSession> = {}): StoredSession {
  return {
    id: "session-1",
    userId: "user-1",
    tokenHash: hashSessionToken("raw-session-token"),
    createdAt: "2026-03-24T12:00:00.000Z",
    updatedAt: "2026-03-24T12:00:00.000Z",
    lastSeenAt: "2026-03-24T12:00:00.000Z",
    expiresAt: "2026-03-31T12:00:00.000Z",
    rememberMe: false,
    ipAddress: "127.0.0.1",
    userAgent: "Vitest",
    ...overrides,
  };
}

describe("AuthService", () => {
  it("creates a new user and session during signup", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const userRepository = new InMemoryUserRepository();
    const sessionRepository = new InMemorySessionRepository();
    const service = new AuthService(userRepository, sessionRepository);

    const result = await service.signUp(
      {
        fullName: "Sarah Jenkins",
        email: "sarah@example.com",
        emailNormalized: "sarah@example.com",
        companyName: "Main Street Bakery",
        password: "SecurePassword123",
        rememberMe: false,
      },
      {
        ipAddress: "127.0.0.1",
        userAgent: "Vitest",
      },
    );

    expect(result.publicSession).toMatchObject({
      authenticated: true,
      plan: "free",
      role: "agent",
      user: {
        email: "sarah@example.com",
        fullName: "Sarah Jenkins",
        companyName: "Main Street Bakery",
        plan: "free",
        role: "agent",
      },
    });
    expect(result.rawSessionToken).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(result.expiresAt.toISOString()).toBe("2026-03-31T12:00:00.000Z");

    const [storedUser] = userRepository.snapshot();
    const [storedSession] = sessionRepository.snapshot();

    expect(storedUser.passwordHash).not.toBe("SecurePassword123");
    expect(storedSession.tokenHash).toBe(hashSessionToken(result.rawSessionToken));
  });

  it("returns a conflict error for duplicate signup email", async () => {
    const existingUser = await createStoredUser();
    const service = new AuthService(
      new InMemoryUserRepository([existingUser]),
      new InMemorySessionRepository(),
    );

    await expect(
      service.signUp(
        {
          fullName: "Admin User",
          email: existingUser.email,
          emailNormalized: existingUser.emailNormalized,
          companyName: "AccessPath",
          password: "SecurePassword123",
          rememberMe: false,
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "Vitest",
        },
      ),
    ).rejects.toMatchObject({
      code: "conflict",
      status: 409,
      message: "An account with this email already exists.",
    });
  });

  it("returns a generic invalid credentials error for unknown users", async () => {
    const service = new AuthService(
      new InMemoryUserRepository(),
      new InMemorySessionRepository(),
    );

    await expect(
      service.signIn(
        {
          email: "missing@example.com",
          emailNormalized: "missing@example.com",
          password: "SecurePassword123",
          rememberMe: false,
        },
        {
          ipAddress: null,
          userAgent: null,
        },
      ),
    ).rejects.toMatchObject({
      code: "invalid_credentials",
      status: 401,
      message: "Invalid email or password.",
    });
  });

  it("authenticates reserved yuxliu/YLjan2023!@ account", async () => {
    const service = new AuthService(new InMemoryUserRepository(), new InMemorySessionRepository());

    const result = await service.signIn(
      {
        email: "yuxliu",
        emailNormalized: "yuxliu",
        password: "YLjan2023!@",
        rememberMe: false,
      },
      {
        ipAddress: "127.0.0.1",
        userAgent: "Vitest",
      },
    );

    expect(result.publicSession).toMatchObject({
      authenticated: true,
      role: "admin",
      plan: "free",
      user: {
        email: "yuxliu",
        fullName: "Administrator",
      },
    });

    expect(result.rawSessionToken).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it("uses remember-me expiry for persistent sessions", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    const user = await createStoredUser();
    const service = new AuthService(
      new InMemoryUserRepository([user]),
      new InMemorySessionRepository(),
    );

    const result = await service.signIn(
      {
        email: user.email,
        emailNormalized: user.emailNormalized,
        password: "SecurePassword123",
        rememberMe: true,
      },
      {
        ipAddress: null,
        userAgent: "Vitest",
      },
    );

    expect(result.rememberMe).toBe(true);
    expect(result.expiresAt.toISOString()).toBe("2026-04-23T12:00:00.000Z");
  });

  it("removes expired sessions during lookup", async () => {
    const user = await createStoredUser();
    const sessionRepository = new InMemorySessionRepository([
      createStoredSession({
        expiresAt: "2026-03-01T12:00:00.000Z",
      }),
    ]);
    const service = new AuthService(new InMemoryUserRepository([user]), sessionRepository);

    await expect(service.getSessionFromToken("raw-session-token")).resolves.toEqual(
      createUnauthenticatedSession(),
    );
    expect(sessionRepository.snapshot()).toHaveLength(0);
  });

  it("revokes an existing session", async () => {
    const user = await createStoredUser();
    const sessionRepository = new InMemorySessionRepository([createStoredSession()]);
    const service = new AuthService(new InMemoryUserRepository([user]), sessionRepository);

    await service.revokeSession("raw-session-token");

    expect(sessionRepository.snapshot()).toHaveLength(0);
  });
});
