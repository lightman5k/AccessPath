import type { StoredSession } from "@/types";

export interface SessionRepository {
  findById(id: string): Promise<StoredSession | null>;
  findByTokenHash(tokenHash: string): Promise<StoredSession | null>;
  create(session: StoredSession): Promise<StoredSession>;
  touch(sessionId: string, touchedAt: string): Promise<StoredSession | null>;
  deleteById(id: string): Promise<void>;
  deleteExpired(nowIso: string): Promise<number>;
}
