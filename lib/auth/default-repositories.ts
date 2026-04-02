import { authConfig } from "./config";
import { DbSessionRepository } from "./db-session-repository";
import { DbUserRepository } from "./db-user-repository";
import { FileSessionRepository } from "./file-session-repository";
import { FileUserRepository } from "./file-user-repository";
import type { SessionRepository } from "./session-repository";
import type { UserRepository } from "./user-repository";

const defaultUserRepository: UserRepository = authConfig.databaseUrl
  ? new DbUserRepository()
  : new FileUserRepository();

const defaultSessionRepository: SessionRepository = authConfig.databaseUrl
  ? new DbSessionRepository()
  : new FileSessionRepository();

export function getUserRepository() {
  return defaultUserRepository;
}

export function getSessionRepository() {
  return defaultSessionRepository;
}
