import { NextResponse } from "next/server";
import { integrationCatalog } from "@/lib/mock/integrations";
import type { IntegrationApiItem, IntegrationsApiResponse } from "@/types";

const integrationMetadata: Record<
  IntegrationApiItem["id"],
  Omit<IntegrationApiItem, "id" | "name" | "description">
> = {
  shopify: {
    provider: "Shopify",
    category: "Commerce",
    status: "connected",
    syncState: "idle",
    lastSyncAt: "2026-03-18T14:20:00.000Z",
    availableActions: ["manage", "reconnect"],
  },
  salesforce: {
    provider: "Salesforce",
    category: "CRM",
    status: "not-connected",
    syncState: "idle",
    availableActions: ["connect"],
  },
  quickbooks: {
    provider: "QuickBooks",
    category: "Accounting",
    status: "error",
    syncState: "error",
    lastSyncAt: "2026-03-18T09:05:00.000Z",
    availableActions: ["reconnect", "manage"],
  },
  "google-drive": {
    provider: "Google Drive",
    category: "Storage",
    status: "syncing",
    syncState: "syncing",
    lastSyncAt: "2026-03-18T15:10:00.000Z",
    availableActions: ["manage"],
  },
};

export async function GET() {
  const items: IntegrationApiItem[] = integrationCatalog.map((integration) => ({
    ...integration,
    ...integrationMetadata[integration.id],
  }));

  const payload: IntegrationsApiResponse = {
    generatedAt: new Date().toISOString(),
    items,
  };

  return NextResponse.json(payload);
}
