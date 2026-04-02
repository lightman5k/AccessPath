import type {
  StoredSettingsAuditLogEntry,
  StoredUserSettings,
  StoredUserSettingsInput,
} from "@/types";

export interface SettingsRepository {
  findByUserId(userId: string): Promise<StoredUserSettings | null>;
  upsert(userId: string, input: StoredUserSettingsInput): Promise<StoredUserSettings>;
  listAuditLog(userId: string): Promise<StoredSettingsAuditLogEntry[]>;
  appendAuditLog(entries: StoredSettingsAuditLogEntry[]): Promise<StoredSettingsAuditLogEntry[]>;
}
