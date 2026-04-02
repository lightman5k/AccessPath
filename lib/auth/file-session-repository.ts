import { authConfig } from "./config";
import { mutateJsonFile, readJsonFile } from "./file-store";
import type { SessionRepository } from "./session-repository";
import type { StoredSession } from "@/types";

const defaultSessions: StoredSession[] = [];

/**
 * Local/demo-only session repository backed by JSON files.
 * This is intentionally simple and only safe for a single running instance.
 */
export class FileSessionRepository implements SessionRepository {
  constructor(private readonly filePath = authConfig.sessionsFilePath) {}

  async findById(id: string) {
    const sessions = await readJsonFile(this.filePath, defaultSessions);
    return sessions.find((session) => session.id === id) ?? null;
  }

  async findByTokenHash(tokenHash: string) {
    const sessions = await readJsonFile(this.filePath, defaultSessions);
    return sessions.find((session) => session.tokenHash === tokenHash) ?? null;
  }

  async create(session: StoredSession) {
    const sessions = await mutateJsonFile(this.filePath, defaultSessions, (currentSessions) => [
      ...currentSessions,
      session,
    ]);

    return sessions.find((storedSession) => storedSession.id === session.id) ?? session;
  }

  async touch(sessionId: string, touchedAt: string) {
    const sessions = await mutateJsonFile(this.filePath, defaultSessions, (currentSessions) =>
      currentSessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              lastSeenAt: touchedAt,
              updatedAt: touchedAt,
            }
          : session,
      ),
    );

    return sessions.find((session) => session.id === sessionId) ?? null;
  }

  async deleteById(id: string) {
    await mutateJsonFile(this.filePath, defaultSessions, (currentSessions) =>
      currentSessions.filter((session) => session.id !== id),
    );
  }

  async deleteExpired(nowIso: string) {
    let removedCount = 0;

    await mutateJsonFile(this.filePath, defaultSessions, (currentSessions) => {
      const nextSessions = currentSessions.filter((session) => session.expiresAt > nowIso);
      removedCount = currentSessions.length - nextSessions.length;
      return nextSessions;
    });

    return removedCount;
  }
}
