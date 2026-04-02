import { authConfig } from "@/lib/auth/config";
import { DbDiscussionRepository } from "./db-discussion-repository";
import { FileDiscussionRepository } from "./file-discussion-repository";
import type { DiscussionRepository } from "./repository";

const defaultDiscussionRepository: DiscussionRepository = authConfig.databaseUrl
  ? new DbDiscussionRepository()
  : new FileDiscussionRepository();

export function getDiscussionRepository() {
  return defaultDiscussionRepository;
}
