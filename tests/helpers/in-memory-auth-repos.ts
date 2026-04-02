import type { SessionRepository } from "@/lib/auth/session-repository";
import type { UserRepository } from "@/lib/auth/user-repository";
import type { MockPlan, MockRole, StoredSession, StoredUser } from "@/types";

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, StoredUser>();

  constructor(initialUsers: StoredUser[] = []) {
    for (const user of initialUsers) {
      this.users.set(user.id, { ...user });
    }
  }

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }

  async findByEmailNormalized(emailNormalized: string) {
    for (const user of this.users.values()) {
      if (user.emailNormalized === emailNormalized) {
        return { ...user };
      }
    }

    return null;
  }

  async create(user: StoredUser) {
    if (await this.findByEmailNormalized(user.emailNormalized)) {
      throw new Error("AUTH_USER_CONFLICT");
    }

    this.users.set(user.id, { ...user });
    return { ...user };
  }

  async findAll() {
    return this.snapshot();
  }

  async deleteById(id: string) {
    this.users.delete(id);
  }

  async updateProfile(
    id: string,
    profile: Pick<StoredUser, "fullName" | "email" | "emailNormalized" | "companyName">,
  ) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    for (const candidate of this.users.values()) {
      if (candidate.id !== id && candidate.emailNormalized === profile.emailNormalized) {
        throw new Error("AUTH_USER_CONFLICT");
      }
    }

    const nextUser = {
      ...user,
      fullName: profile.fullName,
      email: profile.email,
      emailNormalized: profile.emailNormalized,
      companyName: profile.companyName,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, nextUser);
    return { ...nextUser };
  }

  async updatePlan(id: string, plan: MockPlan) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const nextUser = { ...user, plan };
    this.users.set(id, nextUser);
    return { ...nextUser };
  }

  async updateRole(id: string, role: MockRole) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const nextUser = { ...user, role };
    this.users.set(id, nextUser);
    return { ...nextUser };
  }

  snapshot() {
    return Array.from(this.users.values()).map((user) => ({ ...user }));
  }
}

export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions = new Map<string, StoredSession>();

  constructor(initialSessions: StoredSession[] = []) {
    for (const session of initialSessions) {
      this.sessions.set(session.id, { ...session });
    }
  }

  async findById(id: string) {
    return this.sessions.get(id) ?? null;
  }

  async findByTokenHash(tokenHash: string) {
    for (const session of this.sessions.values()) {
      if (session.tokenHash === tokenHash) {
        return { ...session };
      }
    }

    return null;
  }

  async create(session: StoredSession) {
    this.sessions.set(session.id, { ...session });
    return { ...session };
  }

  async touch(sessionId: string, touchedAt: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const nextSession = {
      ...session,
      lastSeenAt: touchedAt,
      updatedAt: touchedAt,
    };

    this.sessions.set(sessionId, nextSession);
    return { ...nextSession };
  }

  async deleteById(id: string) {
    this.sessions.delete(id);
  }

  async deleteExpired(nowIso: string) {
    let deletedCount = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt <= nowIso) {
        this.sessions.delete(id);
        deletedCount += 1;
      }
    }

    return deletedCount;
  }

  snapshot() {
    return Array.from(this.sessions.values()).map((session) => ({ ...session }));
  }
}
