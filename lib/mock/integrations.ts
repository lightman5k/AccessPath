import type { IntegrationCatalogItem } from "@/types";

export const integrationsStorageKey = "integrations:manager:v1";

export const integrationCatalog: IntegrationCatalogItem[] = [
  {
    id: "shopify",
    name: "Shopify",
    description: "Sync products, orders, and fulfillment events.",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Push customer records and support account history.",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Send invoice and payment updates to accounting.",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Archive reports and workflow exports to shared folders.",
  },
];
