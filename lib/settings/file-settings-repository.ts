import { authConfig } from "@/lib/auth/config";
import { mutateJsonFile, readJsonFile } from "@/lib/auth/file-store";
import type {
  SettingsState,
  StoredSettingsAuditLogEntry,
  StoredUserSettings,
  StoredUserSettingsInput,
} from "@/types";
import type { SettingsRepository } from "./settings-repository";

const defaultStoredSettings: StoredUserSettings[] = [];
const defaultStoredAuditLog: StoredSettingsAuditLogEntry[] = [];

const defaultSettingsInput: StoredUserSettingsInput = {
  teamSize: "",
  twoFactorEnabled: false,
  sessionAlertsEnabled: true,
  productUpdatesEnabled: false,
  incidentAlertsEnabled: true,
};

export function buildSettingsState(
  profile: Pick<SettingsState, "fullName" | "email" | "organizationName">,
  storedSettings: StoredUserSettings | null,
): SettingsState {
  return {
    ...profile,
    teamSize: storedSettings?.teamSize ?? defaultSettingsInput.teamSize,
    twoFactorEnabled: storedSettings?.twoFactorEnabled ?? defaultSettingsInput.twoFactorEnabled,
    sessionAlertsEnabled:
      storedSettings?.sessionAlertsEnabled ?? defaultSettingsInput.sessionAlertsEnabled,
    productUpdatesEnabled:
      storedSettings?.productUpdatesEnabled ?? defaultSettingsInput.productUpdatesEnabled,
    incidentAlertsEnabled:
      storedSettings?.incidentAlertsEnabled ?? defaultSettingsInput.incidentAlertsEnabled,
  };
}

export class FileSettingsRepository implements SettingsRepository {
  constructor(
    private readonly settingsFilePath = authConfig.settingsFilePath,
    private readonly auditLogFilePath = authConfig.settingsAuditLogFilePath,
  ) {}

  async findByUserId(userId: string) {
    const items = await readJsonFile(this.settingsFilePath, defaultStoredSettings);
    return items.find((item) => item.userId === userId) ?? null;
  }

  async upsert(userId: string, input: StoredUserSettingsInput) {
    let updatedSettings: StoredUserSettings | null = null;
    const nowIso = new Date().toISOString();

    await mutateJsonFile(this.settingsFilePath, defaultStoredSettings, (currentItems) => {
      const existingItem = currentItems.find((item) => item.userId === userId);

      if (existingItem) {
        updatedSettings = {
          ...existingItem,
          ...input,
          updatedAt: nowIso,
        };

        return currentItems.map((item) => (item.userId === userId ? updatedSettings! : item));
      }

      updatedSettings = {
        userId,
        ...defaultSettingsInput,
        ...input,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      return [...currentItems, updatedSettings];
    });

    return updatedSettings!;
  }

  async listAuditLog(userId: string) {
    const entries = await readJsonFile(this.auditLogFilePath, defaultStoredAuditLog);
    return entries
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
  }

  async appendAuditLog(entries: StoredSettingsAuditLogEntry[]) {
    if (entries.length === 0) return [];

    await mutateJsonFile(this.auditLogFilePath, defaultStoredAuditLog, (currentEntries) => {
      return [...entries, ...currentEntries];
    });

    return entries;
  }
}
