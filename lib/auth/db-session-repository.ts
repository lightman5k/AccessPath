import { ensureAuthDatabaseSchema, getAuthDatabase } from "./database";
import type { SessionRepository } from "./session-repository";
import type { StoredSession } from "@/types";

type AuthSessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
  expires_at: string;
  remember_me: boolean;
  ip_address: string | null;
  user_agent: string | null;
};

function toStoredSession(row: AuthSessionRow): StoredSession {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSeenAt: row.last_seen_at,
    expiresAt: row.expires_at,
    rememberMe: row.remember_me,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
  };
}

export class DbSessionRepository implements SessionRepository {
  async findById(id: string) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();
    const [row] = (await sql`
      SELECT
        id,
        user_id,
        token_hash,
        created_at,
        updated_at,
        last_seen_at,
        expires_at,
        remember_me,
        ip_address,
        user_agent
      FROM auth_sessions
      WHERE id = ${id}
      LIMIT 1
    `) as AuthSessionRow[];

    return row ? toStoredSession(row) : null;
  }

  async findByTokenHash(tokenHash: string) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();
    const [row] = (await sql`
      SELECT
        id,
        user_id,
        token_hash,
        created_at,
        updated_at,
        last_seen_at,
        expires_at,
        remember_me,
        ip_address,
        user_agent
      FROM auth_sessions
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `) as AuthSessionRow[];

    return row ? toStoredSession(row) : null;
  }

  async create(session: StoredSession) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();
    const [row] = (await sql`
      INSERT INTO auth_sessions (
        id,
        user_id,
        token_hash,
        created_at,
        updated_at,
        last_seen_at,
        expires_at,
        remember_me,
        ip_address,
        user_agent
      )
      VALUES (
        ${session.id},
        ${session.userId},
        ${session.tokenHash},
        ${session.createdAt},
        ${session.updatedAt},
        ${session.lastSeenAt},
        ${session.expiresAt},
        ${session.rememberMe},
        ${session.ipAddress},
        ${session.userAgent}
      )
      RETURNING
        id,
        user_id,
        token_hash,
        created_at,
        updated_at,
        last_seen_at,
        expires_at,
        remember_me,
        ip_address,
        user_agent
    `) as AuthSessionRow[];

    return row ? toStoredSession(row) : session;
  }

  async touch(sessionId: string, touchedAt: string) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();
    const [row] = (await sql`
      UPDATE auth_sessions
      SET
        last_seen_at = ${touchedAt},
        updated_at = ${touchedAt}
      WHERE id = ${sessionId}
      RETURNING
        id,
        user_id,
        token_hash,
        created_at,
        updated_at,
        last_seen_at,
        expires_at,
        remember_me,
        ip_address,
        user_agent
    `) as AuthSessionRow[];

    return row ? toStoredSession(row) : null;
  }

  async deleteById(id: string) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();
    await sql`DELETE FROM auth_sessions WHERE id = ${id}`;
  }

  async deleteExpired(nowIso: string) {
    await ensureAuthDatabaseSchema();
    const sql = getAuthDatabase();
    const rows = (await sql`
      DELETE FROM auth_sessions
      WHERE expires_at <= ${nowIso}
      RETURNING id
    `) as Array<{ id: string }>;

    return rows.length;
  }
}
