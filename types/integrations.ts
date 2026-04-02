import type { SupportRecordSourceSummary } from "./support-records";

export type IntegrationId =
  | "shopify"
  | "salesforce"
  | "quickbooks"
  | "google-drive"
  | "manual-entry";

export type IntegrationStatus = "connected" | "not-connected" | "syncing" | "error";

export type IntegrationItem = {
  id: IntegrationId;
  name: string;
  description: string;
  status: IntegrationStatus;
  lastSyncAt?: string;
};

export type IntegrationCatalogItem = Omit<IntegrationItem, "status" | "lastSyncAt">;

export type StoredIntegrationState = {
  userId: string;
  integrationId: IntegrationId;
  status: IntegrationStatus;
  lastSyncAt?: string;
  updatedAt: string;
};

export type IntegrationManualSourceSummary = SupportRecordSourceSummary;
