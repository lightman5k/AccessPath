import { NextRequest, NextResponse } from "next/server";
import { hasFeatureAccess } from "@/lib/auth/feature-access";
import { buildApiNoStoreHeaders, requireApiSession } from "@/lib/auth/api-guard";
import { FileIntegrationRepository } from "@/lib/integrations/file-integration-repository";
import { buildSupportRecordSourceSummary } from "@/lib/support-records/metrics";
import { getSupportRecordRepository } from "@/lib/support-records/default-repository";
import { integrationCatalog } from "@/lib/mock/integrations";
import type {
  IntegrationApiItem,
  IntegrationErrorResponse,
  IntegrationsApiResponse,
  UpdateIntegrationRequest,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: buildApiNoStoreHeaders(),
  });
}

function syncStateForStatus(status: IntegrationApiItem["status"]): IntegrationApiItem["syncState"] {
  if (status === "syncing") return "syncing";
  if (status === "error") return "error";
  return "idle";
}

const integrationMetadata: Record<
  IntegrationApiItem["id"],
  Omit<IntegrationApiItem, "id" | "name" | "description" | "manualSummary">
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
  "manual-entry": {
    provider: "Manual Input",
    category: "Support Metrics",
    status: "not-connected",
    syncState: "idle",
    availableActions: ["manage"],
  },
};

const validIntegrationIds = new Set(integrationCatalog.map((item) => item.id));

async function buildIntegrationsPayload(userId: string): Promise<IntegrationsApiResponse> {
  const repository = new FileIntegrationRepository();
  const supportRecordRepository = getSupportRecordRepository();
  const [states, supportRecords] = await Promise.all([
    repository.listStatesByUserId(userId),
    supportRecordRepository.listByUserId(userId),
  ]);
  const statesById = new Map(states.map((item) => [item.integrationId, item]));
  const manualSummary = buildSupportRecordSourceSummary(supportRecords) ?? undefined;

  const items: IntegrationApiItem[] = integrationCatalog.map((integration) => {
    const metadata = integrationMetadata[integration.id];
    const storedState = statesById.get(integration.id);
    const fallbackStatus =
      integration.id === "manual-entry" && manualSummary ? "connected" : metadata.status;
    const status = storedState?.status ?? fallbackStatus;
    const lastSyncAt =
      integration.id === "manual-entry"
        ? manualSummary?.latestSubmittedAt ?? storedState?.lastSyncAt ?? metadata.lastSyncAt
        : storedState?.lastSyncAt ?? metadata.lastSyncAt;

    return {
      ...integration,
      ...metadata,
      status,
      syncState: syncStateForStatus(status),
      lastSyncAt,
      manualSummary: integration.id === "manual-entry" ? manualSummary : undefined,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    items,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<IntegrationErrorResponse>({ error: "Authentication required." }, 401);
  }

  return jsonResponse(await buildIntegrationsPayload(currentUser.id));
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<IntegrationErrorResponse>({ error: "Authentication required." }, 401);
  }

  let body: UpdateIntegrationRequest | null = null;

  try {
    body = (await request.json()) as UpdateIntegrationRequest;
  } catch {
    return jsonResponse<IntegrationErrorResponse>({ error: "Invalid JSON body." }, 400);
  }

  if (!body?.integrationId || !validIntegrationIds.has(body.integrationId)) {
    return jsonResponse<IntegrationErrorResponse>({ error: "A valid integration ID is required." }, 400);
  }

  if (
    body.action !== "connect" &&
    body.action !== "disconnect" &&
    body.action !== "test"
  ) {
    return jsonResponse<IntegrationErrorResponse>({ error: "A valid integration action is required." }, 400);
  }

  if (
    body.integrationId === "salesforce" &&
    (body.action === "connect" || body.action === "test") &&
    !hasFeatureAccess(auth.session, "salesforceIntegration")
  ) {
    return jsonResponse<IntegrationErrorResponse>(
      { error: "Salesforce integration requires Pro or Premium." },
      403,
    );
  }

  const repository = new FileIntegrationRepository();
  const nowIso = new Date().toISOString();

  if (body.integrationId === "manual-entry") {
    return jsonResponse<IntegrationErrorResponse>(
      { error: "Use the manual source form or CSV import to add support records." },
      400,
    );
  }

  const nextStatus = body.action === "disconnect" ? "not-connected" : "connected";

  await repository.upsertState({
    userId: currentUser.id,
    integrationId: body.integrationId,
    status: nextStatus,
    lastSyncAt: nextStatus === "connected" ? nowIso : undefined,
    updatedAt: nowIso,
  });

  return jsonResponse(await buildIntegrationsPayload(currentUser.id));
}

