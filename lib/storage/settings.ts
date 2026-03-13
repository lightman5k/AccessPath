import { defaultSettings } from "@/lib/mock/settings";
import type { SettingsState } from "@/types";

export const settingsStorageKey = "settings:page:v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readStoredSettings(): SettingsState | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(settingsStorageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return {
      fullName: parsed.fullName ?? defaultSettings.fullName,
      email: parsed.email ?? defaultSettings.email,
      organizationName: parsed.organizationName ?? defaultSettings.organizationName,
      teamSize: parsed.teamSize ?? defaultSettings.teamSize,
      twoFactorEnabled: parsed.twoFactorEnabled ?? defaultSettings.twoFactorEnabled,
      sessionAlertsEnabled:
        parsed.sessionAlertsEnabled ?? defaultSettings.sessionAlertsEnabled,
      productUpdatesEnabled:
        parsed.productUpdatesEnabled ?? defaultSettings.productUpdatesEnabled,
      incidentAlertsEnabled:
        parsed.incidentAlertsEnabled ?? defaultSettings.incidentAlertsEnabled,
    };
  } catch {
    return null;
  }
}

export function writeStoredSettings(settings: SettingsState) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
}

export function clearStoredSettings() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(settingsStorageKey);
}
