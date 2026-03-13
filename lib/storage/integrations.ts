import { integrationCatalog } from "@/lib/mock/integrations";
import type { IntegrationItem, IntegrationStatus } from "@/types";

export const integrationsStorageKey = "integrations:manager:v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function defaultStoredIntegrations(): IntegrationItem[] {
  return integrationCatalog.map((entry) => ({
    ...entry,
    status: "not-connected",
  }));
}

function parseStoredIntegrations(raw: string): IntegrationItem[] | null {
  try {
    const parsed = JSON.parse(raw) as Partial<IntegrationItem>[];
    if (!Array.isArray(parsed)) return null;

    const byId = new Map(parsed.map((item) => [item.id, item]));

    return integrationCatalog.map((entry) => {
      const stored = byId.get(entry.id);
      const status = stored?.status;
      const safeStatus: IntegrationStatus =
        status === "connected" ||
        status === "not-connected" ||
        status === "syncing" ||
        status === "error"
          ? status
          : "not-connected";

      return {
        ...entry,
        status: safeStatus,
        lastSyncAt: typeof stored?.lastSyncAt === "string" ? stored.lastSyncAt : undefined,
      };
    });
  } catch {
    return null;
  }
}

export function readStoredIntegrations(): IntegrationItem[] | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(integrationsStorageKey);
  if (!raw) return null;
  return parseStoredIntegrations(raw);
}

export function writeStoredIntegrations(items: IntegrationItem[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(integrationsStorageKey, JSON.stringify(items));
}

export function clearStoredIntegrations() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(integrationsStorageKey);
}
