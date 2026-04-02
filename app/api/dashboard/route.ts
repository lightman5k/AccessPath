import { NextRequest, NextResponse } from "next/server";
import { buildApiNoStoreHeaders, requireApiSession } from "@/lib/auth/api-guard";
import { defaultInsightItems } from "@/lib/insights/default-insights";
import { FileInsightActionRepository } from "@/lib/insights/file-insight-action-repository";
import { getSupportRecordRepository } from "@/lib/support-records/default-repository";
import { buildSupportInsights } from "@/lib/support-records/insights";
import {
  buildRecentSupportRecordActivity,
  buildSupportMetricsPayload,
} from "@/lib/support-records/metrics";
import type {
  DashboardAiRecommendation,
  DashboardApiResponse,
  DashboardKpi,
  DashboardRange,
  DashboardSummaryCard,
  InsightItem,
  StoredInsightActionState,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedRanges = new Set(["7d", "30d", "90d"]);

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function parseLimit(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.floor(parsed);
}

function mergeInsightItemsWithActions(
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

function buildKpis(params: {
  highPriorityOpenCount: number;
  openConversationCount: number;
  escalatedConversationCount: number;
  totalConversations: number;
  resolutionRate: number;
  avgResponseMinutes: number;
  escalationRate: number;
}): DashboardKpi[] {
  return [
    {
      label: "Open Conversations",
      value: formatCount(params.openConversationCount),
      change: `${params.highPriorityOpenCount} high priority`,
      trend: "currently require attention",
    },
    {
      label: "Resolution Rate",
      value: formatPercent(params.resolutionRate),
      change: `${formatCount(params.totalConversations)} conversations`,
      trend: "in the selected range",
    },
    {
      label: "Average Response Time",
      value: `${params.avgResponseMinutes.toFixed(1)} min`,
      change: `${formatCount(params.highPriorityOpenCount)} high priority`,
      trend: "currently in the queue",
    },
    {
      label: "Escalation Rate",
      value: formatPercent(params.escalationRate),
      change: `${formatCount(params.escalatedConversationCount)} conversations`,
      trend: "needed follow-up",
    },
  ];
}

function buildSummaries(params: {
  highPriorityOpenCount: number;
  openConversationCount: number;
  breakdown: Array<{ label: string; share: string; trend: string }>;
}): DashboardSummaryCard[] {
  const topCategory = params.breakdown[0];

  return [
    {
      id: "high-priority-open",
      label: "High-Priority Open",
      value: formatCount(params.highPriorityOpenCount),
      helperText:
        params.highPriorityOpenCount > 0
          ? `${formatCount(params.openConversationCount)} conversations remain open in the current range.`
          : "No high-priority conversations are currently open.",
    },
    {
      id: "top-category",
      label: "Top Category",
      value: topCategory?.label ?? "--",
      helperText: topCategory
        ? `${topCategory.share} of current support volume, ${topCategory.trend.toLowerCase()} versus the previous period.`
        : "Import support records to surface category mix.",
    },
  ];
}

function compareInsightPriority(left: InsightItem, right: InsightItem) {
  const rank: Record<InsightItem["priority"], number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return rank[right.priority] - rank[left.priority];
}

function buildAiRecommendations(items: InsightItem[]): DashboardAiRecommendation[] {
  return items
    .filter((item) => item.decision !== "dismissed")
    .sort((left, right) => {
      const leftPending = left.decision === "pending";
      const rightPending = right.decision === "pending";

      if (leftPending !== rightPending) {
        return leftPending ? -1 : 1;
      }

      return compareInsightPriority(left, right);
    })
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.recommendation,
      impact: item.priority === "high" ? "High" : item.priority === "medium" ? "Medium" : "Low",
      category:
        item.decision === "pending"
          ? `${item.category} - Pending`
          : item.decision === "applied"
            ? `${item.category} - Applied`
            : `${item.category} - ${item.decision[0]?.toUpperCase()}${item.decision.slice(1)}`,
    }));
}

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return NextResponse.json(
      { error: "Authentication required.", code: "unauthorized" },
      {
        status: 401,
        headers: buildApiNoStoreHeaders(),
      },
    );
  }

  const rangeParam = request.nextUrl.searchParams.get("range");
  const limitParam = request.nextUrl.searchParams.get("limit");

  const range: DashboardRange = allowedRanges.has(rangeParam ?? "")
    ? (rangeParam as DashboardRange)
    : "30d";

  const limit = parseLimit(limitParam);
  const [insightActions, supportRecords] = await Promise.all([
    new FileInsightActionRepository().listByUserId(currentUser.id),
    getSupportRecordRepository().listByUserId(currentUser.id),
  ]);

  const baseInsights = supportRecords.length > 0 ? buildSupportInsights(supportRecords) : defaultInsightItems;
  const mergedInsights = mergeInsightItemsWithActions(baseInsights, insightActions);
  const supportMetrics = buildSupportMetricsPayload({
    records: supportRecords,
    timeframe: range,
    channel: "all",
    category: "all",
    recentLimit: limit ?? 6,
  });
  const payload: DashboardApiResponse = {
    range,
    generatedAt: new Date().toISOString(),
    hasData: supportMetrics.hasData,
    kpis: buildKpis({
      highPriorityOpenCount: supportMetrics.summary.highPriorityOpenConversations,
      openConversationCount: supportMetrics.summary.openConversations,
      escalatedConversationCount: supportMetrics.summary.escalatedConversations,
      totalConversations: supportMetrics.summary.totalConversations,
      resolutionRate: supportMetrics.summary.resolutionRate,
      avgResponseMinutes: supportMetrics.summary.avgResponseMinutes,
      escalationRate: supportMetrics.summary.escalationRate,
    }),
    summaries: buildSummaries({
      highPriorityOpenCount: supportMetrics.summary.highPriorityOpenConversations,
      openConversationCount: supportMetrics.summary.openConversations,
      breakdown: supportMetrics.breakdown,
    }),
    trend: supportMetrics.trend.map((point) => ({
      label: point.label,
      conversations: point.conversations,
      resolutionRate: point.resolutionRate,
      avgResponseMinutes: point.avgResponseMinutes,
    })),
    recentActivity: limit
      ? buildRecentSupportRecordActivity(supportRecords, limit)
      : supportMetrics.recentRecords,
    aiRecommendations: buildAiRecommendations(mergedInsights),
  };

  return NextResponse.json(payload, {
    headers: buildApiNoStoreHeaders(),
  });
}

