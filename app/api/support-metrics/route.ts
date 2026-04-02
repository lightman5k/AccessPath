import { NextRequest, NextResponse } from "next/server";
import { buildApiNoStoreHeaders, requireApiSession } from "@/lib/auth/api-guard";
import { getSupportRecordRepository } from "@/lib/support-records/default-repository";
import { buildSupportMetricsPayload } from "@/lib/support-records/metrics";
import type {
  DashboardRange,
  SupportMetricsApiResponse,
  SupportMetricsCategoryFilter,
  SupportMetricsChannelFilter,
  SupportRecordErrorResponse,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validRanges = new Set<DashboardRange>(["7d", "30d", "90d"]);
const validChannels = new Set<SupportMetricsChannelFilter>(["all", "Web Chat", "Email", "SMS"]);
const validCategories = new Set<SupportMetricsCategoryFilter>([
  "all",
  "Delivery",
  "Returns",
  "Billing",
  "Account",
]);

function jsonResponse<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: buildApiNoStoreHeaders(),
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<SupportRecordErrorResponse>({ error: "Authentication required." }, 401);
  }

  const timeframeParam = request.nextUrl.searchParams.get("timeframe");
  const channelParam = request.nextUrl.searchParams.get("channel");
  const categoryParam = request.nextUrl.searchParams.get("category");

  const timeframe: DashboardRange = validRanges.has(timeframeParam as DashboardRange)
    ? (timeframeParam as DashboardRange)
    : "30d";
  const channel: SupportMetricsChannelFilter = validChannels.has(
    channelParam as SupportMetricsChannelFilter,
  )
    ? (channelParam as SupportMetricsChannelFilter)
    : "all";
  const category: SupportMetricsCategoryFilter = validCategories.has(
    categoryParam as SupportMetricsCategoryFilter,
  )
    ? (categoryParam as SupportMetricsCategoryFilter)
    : "all";

  const repository = getSupportRecordRepository();
  const records = await repository.listByUserId(currentUser.id);
  const payload: SupportMetricsApiResponse = buildSupportMetricsPayload({
    records,
    timeframe,
    channel,
    category,
  });

  return jsonResponse(payload);
}

