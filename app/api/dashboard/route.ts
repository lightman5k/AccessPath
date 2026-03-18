import { NextRequest, NextResponse } from "next/server";
import {
  dashboardAiRecommendations,
  dashboardInteractions,
  dashboardKpis,
} from "@/lib/mock";
import type { DashboardApiResponse, DashboardRange, DashboardTrendPoint } from "@/types";

const allowedRanges = new Set(["7d", "30d", "90d"]);

const trendDataByRange: Record<DashboardRange, DashboardTrendPoint[]> = {
  "7d": [
    { label: "Mon", conversations: 318, resolutionRate: 89, avgResponseMinutes: 21 },
    { label: "Tue", conversations: 336, resolutionRate: 90, avgResponseMinutes: 20 },
    { label: "Wed", conversations: 351, resolutionRate: 91, avgResponseMinutes: 19 },
    { label: "Thu", conversations: 364, resolutionRate: 92, avgResponseMinutes: 18 },
    { label: "Fri", conversations: 389, resolutionRate: 92, avgResponseMinutes: 17 },
    { label: "Sat", conversations: 342, resolutionRate: 91, avgResponseMinutes: 18 },
    { label: "Sun", conversations: 327, resolutionRate: 92, avgResponseMinutes: 18 },
  ],
  "30d": [
    { label: "Week 1", conversations: 2210, resolutionRate: 88, avgResponseMinutes: 22 },
    { label: "Week 2", conversations: 2345, resolutionRate: 90, avgResponseMinutes: 20 },
    { label: "Week 3", conversations: 2498, resolutionRate: 91, avgResponseMinutes: 19 },
    { label: "Week 4", conversations: 2621, resolutionRate: 92, avgResponseMinutes: 18 },
  ],
  "90d": [
    { label: "Jan", conversations: 8910, resolutionRate: 86, avgResponseMinutes: 24 },
    { label: "Feb", conversations: 9420, resolutionRate: 89, avgResponseMinutes: 21 },
    { label: "Mar", conversations: 10180, resolutionRate: 92, avgResponseMinutes: 18 },
  ],
};

function parseLimit(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.floor(parsed);
}

export async function GET(request: NextRequest) {
  const rangeParam = request.nextUrl.searchParams.get("range");
  const limitParam = request.nextUrl.searchParams.get("limit");

  const range: DashboardRange = allowedRanges.has(rangeParam ?? "")
    ? (rangeParam as DashboardRange)
    : "30d";

  const limit = parseLimit(limitParam);
  const recentActivity = limit
    ? dashboardInteractions.slice(0, limit)
    : dashboardInteractions;

  const payload: DashboardApiResponse = {
    range,
    generatedAt: new Date().toISOString(),
    kpis: dashboardKpis,
    trend: trendDataByRange[range],
    recentActivity,
    aiRecommendations: dashboardAiRecommendations,
  };

  return NextResponse.json(payload);
}
