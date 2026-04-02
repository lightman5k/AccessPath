import { NextRequest, NextResponse } from "next/server";
import { buildApiNoStoreHeaders, requireApiSession } from "@/lib/auth/api-guard";
import { defaultInsightItems } from "@/lib/insights/default-insights";
import { FileInsightActionRepository } from "@/lib/insights/file-insight-action-repository";
import { FileSupportRecordRepository } from "@/lib/support-records/file-support-record-repository";
import { buildSupportInsights } from "@/lib/support-records/insights";
import type {
  InsightAction,
  InsightItem,
  InsightsApiResponse,
  InsightsErrorResponse,
  StoredInsightActionState,
  UpdateInsightRequest,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: buildApiNoStoreHeaders(),
  });
}

function mergeInsightsWithActions(
  items: InsightItem[],
  actions: StoredInsightActionState[],
): InsightItem[] {
  const actionsByInsightId = new Map(actions.map((item) => [item.insightId, item]));

  return items.map((item) => {
    const action = actionsByInsightId.get(item.id);
    if (!action) return item;

    return {
      ...item,
      status: action.status,
      decision: action.decision,
      decisionUpdatedAt: action.updatedAt,
    };
  });
}

function applyInsightAction(item: InsightItem, action: InsightAction): InsightItem {
  const nowIso = new Date().toISOString();

  if (action === "review") {
    return {
      ...item,
      status: "in-review",
      decision: "pending",
      decisionUpdatedAt: nowIso,
    };
  }

  if (action === "apply") {
    return {
      ...item,
      status: "ready",
      decision: "applied",
      decisionUpdatedAt: nowIso,
    };
  }

  if (action === "dismiss") {
    return {
      ...item,
      decision: "dismissed",
      decisionUpdatedAt: nowIso,
    };
  }

  return {
    ...item,
    status: "in-review",
    decision: "escalated",
    decisionUpdatedAt: nowIso,
  };
}

function isValidInsightAction(value: unknown): value is InsightAction {
  return value === "review" || value === "apply" || value === "dismiss" || value === "escalate";
}

async function buildInsightsPayload(userId: string) {
  const repository = new FileInsightActionRepository();
  const supportRecordRepository = new FileSupportRecordRepository();
  const [actions, supportRecords] = await Promise.all([
    repository.listByUserId(userId),
    supportRecordRepository.listByUserId(userId),
  ]);
  const sourceItems = supportRecords.length > 0 ? buildSupportInsights(supportRecords) : defaultInsightItems;

  const payload: InsightsApiResponse = {
    generatedAt: new Date().toISOString(),
    items: mergeInsightsWithActions(sourceItems, actions),
  };

  return payload;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<InsightsErrorResponse>({ error: "Authentication required." }, 401);
  }

  return jsonResponse(await buildInsightsPayload(currentUser.id));
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<InsightsErrorResponse>({ error: "Authentication required." }, 401);
  }

  let body: UpdateInsightRequest | null = null;

  try {
    body = (await request.json()) as UpdateInsightRequest;
  } catch {
    return jsonResponse<InsightsErrorResponse>({ error: "Invalid JSON body." }, 400);
  }

  if (!body?.insightId || typeof body.insightId !== "string") {
    return jsonResponse<InsightsErrorResponse>({ error: "Insight ID is required." }, 400);
  }

  if (!isValidInsightAction(body.action)) {
    return jsonResponse<InsightsErrorResponse>({ error: "A valid insight action is required." }, 400);
  }

  const currentPayload = await buildInsightsPayload(currentUser.id);
  const insight = currentPayload.items.find((item) => item.id === body?.insightId);
  if (!insight) {
    return jsonResponse<InsightsErrorResponse>({ error: "Insight not found." }, 404);
  }

  const nextInsight = applyInsightAction(insight, body.action);
  const repository = new FileInsightActionRepository();
  await repository.upsert({
    userId: currentUser.id,
    insightId: nextInsight.id,
    status: nextInsight.status,
    decision: nextInsight.decision,
    updatedAt: nextInsight.decisionUpdatedAt ?? new Date().toISOString(),
  });

  return jsonResponse(await buildInsightsPayload(currentUser.id));
}
