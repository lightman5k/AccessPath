import type {
  DashboardInteraction,
  DashboardRange,
  SupportMetricsApiResponse,
  SupportMetricsBreakdownItem,
  SupportMetricsCategoryFilter,
  SupportMetricsChannelFilter,
  SupportMetricsSnapshot,
  SupportMetricsSummary,
  SupportMetricsTrendPoint,
  StoredSupportRecord,
  SupportRecordCategory,
  SupportRecordSourceSummary,
} from "@/types";

const timeframeDays: Record<DashboardRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const categoryOrder: SupportRecordCategory[] = ["Delivery", "Returns", "Billing", "Account"];
const trendLabelsByRange: Record<DashboardRange, string[]> = {
  "7d": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "30d": ["Week 1", "Week 2", "Week 3", "Week 4"],
  "90d": ["Month 1", "Month 2", "Month 3"],
};

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatVolume(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatShortTime(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

function getWindowStart(range: DashboardRange, now = new Date()) {
  return new Date(now.getTime() - timeframeDays[range] * 24 * 60 * 60 * 1000);
}

function getPreviousWindowStart(range: DashboardRange, now = new Date()) {
  return new Date(now.getTime() - timeframeDays[range] * 2 * 24 * 60 * 60 * 1000);
}

function filterRecords(
  records: StoredSupportRecord[],
  filters: {
    range: DashboardRange;
    channel?: SupportMetricsChannelFilter;
    category?: SupportMetricsCategoryFilter;
    usePreviousWindow?: boolean;
    now?: Date;
  },
) {
  const now = filters.now ?? new Date();
  const start = filters.usePreviousWindow
    ? getPreviousWindowStart(filters.range, now)
    : getWindowStart(filters.range, now);
  const end = filters.usePreviousWindow ? getWindowStart(filters.range, now) : now;

  return records.filter((record) => {
    const occurredMs = Date.parse(record.occurredAt);
    if (Number.isNaN(occurredMs)) return false;
    if (occurredMs < start.getTime() || occurredMs > end.getTime()) return false;
    if (filters.channel && filters.channel !== "all" && record.channel !== filters.channel) {
      return false;
    }
    if (filters.category && filters.category !== "all" && record.category !== filters.category) {
      return false;
    }
    return true;
  });
}

function summarizeRecords(records: StoredSupportRecord[]): SupportMetricsSummary {
  if (records.length === 0) {
    return {
      totalConversations: 0,
      resolutionRate: 0,
      avgResponseMinutes: 0,
      escalationRate: 0,
      openConversations: 0,
      escalatedConversations: 0,
      highPriorityOpenConversations: 0,
    };
  }

  const resolvedCount = records.filter((record) => record.status === "Resolved").length;
  const escalatedCount = records.filter((record) => record.status === "Escalated").length;
  const openCount = records.filter((record) => record.status !== "Resolved").length;
  const highPriorityOpenCount = records.filter(
    (record) => record.priority === "High" && record.status !== "Resolved",
  ).length;
  const avgResponseMinutes =
    records.reduce((sum, record) => sum + record.responseMinutes, 0) / records.length;

  return {
    totalConversations: records.length,
    resolutionRate: (resolvedCount / records.length) * 100,
    avgResponseMinutes,
    escalationRate: (escalatedCount / records.length) * 100,
    openConversations: openCount,
    escalatedConversations: escalatedCount,
    highPriorityOpenConversations: highPriorityOpenCount,
  };
}

function buildTrend(
  records: StoredSupportRecord[],
  range: DashboardRange,
  now = new Date(),
): SupportMetricsTrendPoint[] {
  const labels = trendLabelsByRange[range];
  const bucketCount = labels.length;
  const start = getWindowStart(range, now).getTime();
  const totalWindowMs = now.getTime() - start || 1;

  const buckets = Array.from({ length: bucketCount }, () => [] as StoredSupportRecord[]);

  records.forEach((record) => {
    const occurredMs = Date.parse(record.occurredAt);
    if (Number.isNaN(occurredMs)) return;
    const normalized = Math.max(0, Math.min(0.9999, (occurredMs - start) / totalWindowMs));
    const bucketIndex = Math.min(bucketCount - 1, Math.floor(normalized * bucketCount));
    buckets[bucketIndex].push(record);
  });

  return labels.map((label, index) => {
    const bucketSummary = summarizeRecords(buckets[index]);
    return {
      label,
      conversations: bucketSummary.totalConversations,
      resolutionRate: Math.round(bucketSummary.resolutionRate),
      avgResponseMinutes: Number(bucketSummary.avgResponseMinutes.toFixed(1)),
    };
  });
}

function formatTrendDirection(current: number, previous: number) {
  if (previous === 0 && current === 0) return "Flat";
  if (previous === 0 && current > 0) return "New";

  const delta = ((current - previous) / previous) * 100;
  if (Math.abs(delta) < 2) return "Flat";
  return `${delta > 0 ? "Up" : "Down"} ${Math.abs(Math.round(delta))}%`;
}

function buildBreakdown(
  currentRecords: StoredSupportRecord[],
  previousRecords: StoredSupportRecord[],
): SupportMetricsBreakdownItem[] {
  const total = currentRecords.length || 1;

  return categoryOrder
    .map((category) => {
      const currentCount = currentRecords.filter((record) => record.category === category).length;
      const previousCount = previousRecords.filter(
        (record) => record.category === category,
      ).length;

      return {
        label: category,
        share: `${Math.round((currentCount / total) * 100)}%`,
        volume: formatVolume(currentCount),
        trend: formatTrendDirection(currentCount, previousCount),
        currentCount,
      };
    })
    .filter((item) => item.currentCount > 0)
    .map(({ currentCount: _currentCount, ...item }) => item);
}

function buildSnapshots(
  currentSummary: SupportMetricsSummary,
  previousSummary: SupportMetricsSummary,
  breakdown: SupportMetricsBreakdownItem[],
  currentRecords: StoredSupportRecord[],
): SupportMetricsSnapshot[] {
  const snapshots: SupportMetricsSnapshot[] = [];
  const latestOccurredAt = currentRecords[0]?.occurredAt ?? new Date().toISOString();

  snapshots.push({
    id: "support-summary",
    snapshot: "Current support summary",
    summary: `${formatVolume(currentSummary.totalConversations)} conversations, ${formatPercent(currentSummary.resolutionRate)} resolution rate, ${currentSummary.avgResponseMinutes.toFixed(1)} min average response.`,
    status: currentSummary.resolutionRate >= 75 ? "Ready" : "Review",
    updatedAt: formatShortTime(latestOccurredAt),
  });

  if (breakdown[0]) {
    snapshots.push({
      id: "top-category",
      snapshot: `${breakdown[0].label} demand`,
      summary: `${breakdown[0].label} accounts for ${breakdown[0].share} of the current support volume. Trend: ${breakdown[0].trend}.`,
      status: breakdown[0].trend.startsWith("Up") ? "Alert" : "Ready",
      updatedAt: formatShortTime(latestOccurredAt),
    });
  }

  const responseDelta = currentSummary.avgResponseMinutes - previousSummary.avgResponseMinutes;
  const snapshotStatus =
    currentSummary.escalationRate >= 18
      ? "Alert"
      : responseDelta <= -1
        ? "Ready"
        : "Review";

  snapshots.push({
    id: "operational-health",
    snapshot: "Operational health",
    summary:
      currentSummary.escalationRate >= 18
        ? `Escalations reached ${formatPercent(currentSummary.escalationRate)} of the current queue, which suggests support workflows need review.`
        : responseDelta <= -1
          ? `Average response time improved by ${Math.abs(responseDelta).toFixed(1)} minutes versus the previous period.`
          : `High-priority open conversations currently account for ${formatVolume(currentSummary.highPriorityOpenConversations)} active records.`,
    status: snapshotStatus,
    updatedAt: formatShortTime(latestOccurredAt),
  });

  return snapshots;
}

export function buildRecentSupportRecordActivity(
  records: StoredSupportRecord[],
  limit = 6,
): DashboardInteraction[] {
  return [...records]
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
    .slice(0, limit)
    .map((record) => ({
      id: record.id.slice(0, 8).toUpperCase(),
      customer: record.customer,
      channel: record.channel,
      issue: record.subject,
      status: record.status,
      updated: record.occurredAt,
    }));
}

export function buildSupportRecordSourceSummary(
  records: StoredSupportRecord[],
): SupportRecordSourceSummary | null {
  if (records.length === 0) return null;

  const latest = [...records].sort(
    (left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt),
  )[0];
  const latestBatchCount = records.filter((record) => record.batchId === latest.batchId).length;

  return {
    sourceName: latest.sourceName,
    totalRecords: records.length,
    latestSubmittedAt: latest.submittedAt,
    latestInputMethod: latest.inputMethod,
    latestCustomer: latest.customer,
    latestCategory: latest.category,
    latestStatus: latest.status,
    latestBatchCount,
  };
}

export function buildSupportMetricsPayload(params: {
  records: StoredSupportRecord[];
  timeframe: DashboardRange;
  channel: SupportMetricsChannelFilter;
  category: SupportMetricsCategoryFilter;
  now?: Date;
  recentLimit?: number;
}): SupportMetricsApiResponse {
  const now = params.now ?? new Date();
  const currentRecords = filterRecords(params.records, {
    range: params.timeframe,
    channel: params.channel,
    category: params.category,
    now,
  });
  const previousRecords = filterRecords(params.records, {
    range: params.timeframe,
    channel: params.channel,
    category: params.category,
    usePreviousWindow: true,
    now,
  });
  const summary = summarizeRecords(currentRecords);

  return {
    generatedAt: now.toISOString(),
    timeframe: params.timeframe,
    channel: params.channel,
    category: params.category,
    hasData: currentRecords.length > 0,
    summary,
    trend: buildTrend(currentRecords, params.timeframe, now),
    breakdown: buildBreakdown(currentRecords, previousRecords),
    snapshots: buildSnapshots(summary, summarizeRecords(previousRecords), buildBreakdown(currentRecords, previousRecords), currentRecords),
    recentRecords: buildRecentSupportRecordActivity(currentRecords, params.recentLimit ?? 6),
  };
}
