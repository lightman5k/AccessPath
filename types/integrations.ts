export type IntegrationId = "shopify" | "salesforce" | "quickbooks" | "google-drive";

export type IntegrationStatus = "connected" | "not-connected" | "syncing" | "error";

export type IntegrationItem = {
  id: IntegrationId;
  name: string;
  description: string;
  status: IntegrationStatus;
  lastSyncAt?: string;
};

export type IntegrationCatalogItem = Omit<IntegrationItem, "status" | "lastSyncAt">;
