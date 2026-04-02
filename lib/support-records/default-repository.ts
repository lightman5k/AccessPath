import { authConfig } from "@/lib/auth/config";
import { DbSupportRecordRepository } from "./db-support-record-repository";
import { FileSupportRecordRepository } from "./file-support-record-repository";
import type { SupportRecordRepository } from "./repository";

const defaultSupportRecordRepository: SupportRecordRepository = authConfig.databaseUrl
  ? new DbSupportRecordRepository()
  : new FileSupportRecordRepository();

export function getSupportRecordRepository() {
  return defaultSupportRecordRepository;
}
