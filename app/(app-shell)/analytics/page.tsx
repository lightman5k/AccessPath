"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, PageHeader, Table } from "@/components/ui";
import type {
  SupportMetricsApiResponse,
  SupportMetricsCategoryFilter,
  SupportMetricsChannelFilter,
} from "@/types";

type TimeframeOption = "7d" | "30d" | "90d";

const timeframeOptions: Array<{ value: TimeframeOption; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function statusVariant(status: "Ready" | "Alert" | "Review") {
  if (status === "Ready") return "success";
  if (status === "Alert") return "warning";
  return "info";
}

function KpiCard(props: {
  label: string;
  value: string;
  helperText: string;
  accentClass: string;
}) {
  return (
    <Card className={`relative overflow-hidden border ${props.accentClass} p-0 shadow-sm`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-400" />
      <div className="p-5">
        <p className="text-sm font-medium text-gray-600">{props.label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">{props.value}</p>
        <p className="mt-2 text-sm leading-6 text-gray-600">{props.helperText}</p>
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<TimeframeOption>("30d");
  const [channel, setChannel] = useState<SupportMetricsChannelFilter>("all");
  const [category, setCategory] = useState<SupportMetricsCategoryFilter>("all");
  const [metricsData, setMetricsData] = useState<SupportMetricsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMetrics() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          timeframe,
          channel,
          category,
        });
        const response = await fetch(`/api/support-metrics?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Metrics request failed with status ${response.status}.`);
        }

        const payload = (await response.json()) as SupportMetricsApiResponse;
        setMetricsData(payload);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load support metrics.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadMetrics();

    return () => controller.abort();
  }, [timeframe, channel, category, retryKey]);

  const maxConversationValue = useMemo(() => {
    const values = metricsData?.trend.map((point) => point.conversations) ?? [];
    return values.length > 0 ? Math.max(...values, 1) : 1;
  }, [metricsData]);

  const snapshotRows = useMemo(
    () =>
      (metricsData?.snapshots ?? []).map((item) => ({
        key: item.id,
        cells: [
          <div key={`${item.id}-name`}>
            <p className="font-medium text-gray-900">{item.snapshot}</p>
            <p className="mt-1 text-xs text-gray-500">{item.updatedAt}</p>
          </div>,
          <p key={`${item.id}-summary`} className="text-sm text-gray-600">
            {item.summary}
          </p>,
          <Badge key={`${item.id}-status`} variant={statusVariant(item.status)}>
            {item.status}
          </Badge>,
        ],
      })),
    [metricsData],
  );

  const hasActiveFilters =
    timeframe !== "30d" || channel !== "all" || category !== "all";

  if (!metricsData && loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AccessPath Analytics Dashboard"
          description="Track support volume, service quality, and record-level reporting from one shared dataset."
          actions={<Badge variant="info" className="px-3 py-1">Loading metrics</Badge>}
        />
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card
              key={`analytics-loading-${index}`}
              className="h-36 animate-pulse border-gray-200 bg-white"
            >
              <div className="h-full" />
            </Card>
          ))}
        </section>
      </div>
    );
  }

  if (!metricsData && error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AccessPath Analytics Dashboard"
          description="Track support volume, service quality, and record-level reporting from one shared dataset."
        />
        <Card className="border-gray-200 bg-white shadow-sm">
          <EmptyState title="Analytics could not be loaded" description={error} className="py-12" />
          <div className="mt-4 flex justify-center">
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => setRetryKey((current) => current + 1)}
              type="button"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!metricsData) return null;

  return (
    <div className="space-y-7">
      <PageHeader
        title="AccessPath Analytics Dashboard"
        description="Track support volume, service quality, and record-level reporting from one shared dataset."
        actions={
          <Badge variant={metricsData.hasData ? "success" : "neutral"} className="px-3 py-1">
            {metricsData.hasData ? "Support records loaded" : "No imported records yet"}
          </Badge>
        }
      />

      {error ? (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <p className="text-sm font-medium text-amber-900">Analytics refresh failed</p>
          <p className="mt-1 text-sm text-amber-800">{error}</p>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <KpiCard
          accentClass="border-sky-200 bg-gradient-to-br from-sky-50 to-white"
          helperText="Total support interactions in the current filtered window."
          label="Total conversations"
          value={metricsData.summary.totalConversations.toLocaleString()}
        />
        <KpiCard
          accentClass="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
          helperText="Share of interactions marked resolved."
          label="Resolution rate"
          value={`${metricsData.summary.resolutionRate.toFixed(0)}%`}
        />
        <KpiCard
          accentClass="border-amber-200 bg-gradient-to-br from-amber-50 to-white"
          helperText="Average first-response speed across the filtered records."
          label="Average response time"
          value={`${metricsData.summary.avgResponseMinutes.toFixed(1)} min`}
        />
        <KpiCard
          accentClass="border-violet-200 bg-gradient-to-br from-violet-50 to-white"
          helperText="Share of interactions escalated for follow-up."
          label="Escalation rate"
          value={`${metricsData.summary.escalationRate.toFixed(0)}%`}
        />
      </section>

      <Card className="border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-950">Reporting Filters</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Filter the analytics view by timeframe, support channel, and category.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-600" htmlFor="analytics-timeframe">
                Timeframe
              </label>
              <select
                id="analytics-timeframe"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onChange={(event) => setTimeframe(event.target.value as TimeframeOption)}
                value={timeframe}
              >
                {timeframeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600" htmlFor="analytics-channel">
                Channel
              </label>
              <select
                id="analytics-channel"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onChange={(event) =>
                  setChannel(event.target.value as SupportMetricsChannelFilter)
                }
                value={channel}
              >
                <option value="all">All channels</option>
                <option value="Web Chat">Web Chat</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600" htmlFor="analytics-category">
                Category
              </label>
              <select
                id="analytics-category"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onChange={(event) =>
                  setCategory(event.target.value as SupportMetricsCategoryFilter)
                }
                value={category}
              >
                <option value="all">All categories</option>
                <option value="Delivery">Delivery</option>
                <option value="Returns">Returns</option>
                <option value="Billing">Billing</option>
                <option value="Account">Account</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {!metricsData.hasData ? (
        <Card className="border-gray-200 bg-white shadow-sm">
          <EmptyState
            title={
              hasActiveFilters
                ? "No support records match the current filters"
                : "No support records imported yet"
            }
            description={
              hasActiveFilters
                ? "Reset the filters or import a broader batch from Integrations to populate this analytics view."
                : "Import a CSV batch or add support records from Integrations to start populating analytics."
            }
            className="py-12"
          />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {hasActiveFilters ? (
              <button
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onClick={() => {
                  setTimeframe("30d");
                  setChannel("all");
                  setCategory("all");
                }}
                type="button"
              >
                Reset Filters
              </button>
            ) : null}
            <Link
              className="rounded-md border border-sky-300 bg-white px-3 py-2 text-sm text-sky-800 transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2"
              href="/integrations"
            >
              Go to Integrations
            </Link>
            <a
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              download
              href="/templates/support-records-mock.csv"
            >
              Download Sample CSV
            </a>
          </div>
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <Card className="border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-gray-950">Performance Trend</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Volume, resolution rate, and response speed over the selected period.
                  </p>
                </div>
                <Badge variant="neutral">{timeframeOptions.find((option) => option.value === timeframe)?.label}</Badge>
              </div>

              <div className="mt-6 rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-5 shadow-inner">
                <div className="flex h-64 items-end gap-3">
                  {metricsData.trend.map((point) => {
                    const height = `${Math.max(18, (point.conversations / maxConversationValue) * 100)}%`;
                    return (
                      <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
                        <div className="flex h-full w-full items-end">
                          <div
                            className="w-full rounded-t-lg bg-gradient-to-t from-gray-900 via-gray-800 to-gray-600 shadow-sm"
                            style={{ height }}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                            {point.label}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {point.conversations.toLocaleString()} conversations
                          </p>
                          <p className="text-xs text-gray-400">
                            {point.resolutionRate}% resolved
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-gray-950">Operational Breakdown</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Category-level share and trend within the current filtered view.
                  </p>
                </div>
                <Badge variant="info">{channel === "all" ? "All channels" : channel}</Badge>
              </div>

              <div className="mt-5 space-y-4">
                {metricsData.breakdown.length > 0 ? (
                  metricsData.breakdown.map((item) => (
                    <Link
                      key={item.label}
                      className="block rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 transition hover:border-sky-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2"
                      href={`/insights?supportCategory=${encodeURIComponent(item.label)}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-950">{item.label}</h3>
                          <p className="mt-1 text-sm text-gray-600">Share of the current filtered support window.</p>
                        </div>
                        <Badge variant="neutral">{item.trend}</Badge>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Conversation share</span>
                        <span className="font-semibold text-gray-950">{item.share}</span>
                      </div>
                      <div className="mt-2 h-2.5 rounded-full bg-gray-200">
                        <div
                          className="h-2.5 rounded-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-500"
                          style={{ width: item.share }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Reported volume</span>
                        <span className="font-semibold text-gray-950">{item.volume}</span>
                      </div>
                      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-sky-700">
                        View related insights
                      </p>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    title="No breakdown data is available"
                    description="Try broadening the filters or importing more support records."
                  />
                )}
              </div>
            </Card>
          </section>

          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-gray-950">Recent Snapshots</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Summary observations generated from the current support dataset.
                </p>
              </div>
              <Badge className="bg-gray-100 px-3 py-1 text-gray-700" variant="neutral">
                {metricsData.snapshots.length} updates
              </Badge>
            </div>

            {snapshotRows.length > 0 ? (
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50/60 p-1">
                <Table
                  ariaLabel="Recent analytics updates"
                  columns={[
                    { key: "snapshot", header: "Snapshot" },
                    { key: "summary", header: "Summary" },
                    { key: "status", header: "Status", className: "w-32" },
                  ]}
                  rows={snapshotRows}
                />
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState
                  title="No generated snapshots are available"
                  description="Import support records to generate category and operations summaries."
                />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

