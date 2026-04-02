"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, PageHeader, Skeleton, Table } from "@/components/ui";
import { badgeMetaForStatus } from "@/lib";
import type { DashboardApiResponse, DashboardRange } from "@/types";

type TrendMetric = "conversations" | "resolutionRate" | "avgResponseMinutes";

const trendMetricOptions: Array<{
  value: TrendMetric;
  label: string;
  axisLabel: string;
  title: string;
  formatter: (value: number) => string;
}> = [
  {
    value: "conversations",
    label: "Volume",
    axisLabel: "Volume",
    title: "Interaction Volume Trend",
    formatter: (value) => Math.round(value).toString(),
  },
  {
    value: "resolutionRate",
    label: "Resolution",
    axisLabel: "Resolution Rate",
    title: "Resolution Rate Trend",
    formatter: (value) => `${Math.round(value)}%`,
  },
  {
    value: "avgResponseMinutes",
    label: "Response Time",
    axisLabel: "Response Time",
    title: "Response Time Trend",
    formatter: (value) => `${value.toFixed(1)} min`,
  },
] as const;

function minutesSinceIso(value: string): number {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, Math.floor((Date.now() - ms) / 60_000));
}

function formatIsoAsAgo(value: string): string {
  const minutes = minutesSinceIso(value);
  if (minutes === Number.MAX_SAFE_INTEGER) return value;
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function formatRangeLabel(range: DashboardRange): string {
  if (range === "7d") return "Last 7 days";
  if (range === "90d") return "Last 90 days";
  return "Last 30 days";
}

function formatTrendDelta(metric: TrendMetric, current: number, previous?: number) {
  if (previous === undefined) return "Start of selected range";

  const delta = current - previous;
  if (metric === "conversations") {
    return `${delta >= 0 ? "+" : ""}${Math.round(delta)} vs previous point`;
  }

  if (metric === "resolutionRate") {
    return `${delta >= 0 ? "+" : ""}${delta.toFixed(0)} pts vs previous point`;
  }

  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} min vs previous point`;
}

function SectionIcon({ kind }: { kind: "trend" | "table" | "ai" | "actions" | "signals" }) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (kind === "trend") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M4 16 9 11l3 3 8-8" />
        <path d="M15 6h5v5" />
      </svg>
    );
  }

  if (kind === "table") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </svg>
    );
  }

  if (kind === "ai") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 4v16" />
        <path d="M5 12h14" />
        <path d="m7 7 10 10" />
        <path d="m17 7-10 10" />
      </svg>
    );
  }

  if (kind === "signals") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 5v14" />
        <path d="M7 10.5 12 5l5 5.5" />
        <path d="M8.5 15.5h7" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </svg>
  );
}

const quickActions = [
  {
    href: "/workflow-builder",
    label: "Create Workflow",
    accentClass: "bg-blue-100",
    iconClass: "text-blue-600",
    path: "M12 6v6m0 0v6m0-6h6m-6 0H6",
  },
  {
    href: "/analytics",
    label: "Open Analytics",
    accentClass: "bg-green-100",
    iconClass: "text-green-600",
    path: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    href: "/integrations",
    label: "Configure Integrations",
    accentClass: "bg-purple-100",
    iconClass: "text-purple-600",
    path: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    href: "/customer-service",
    label: "Start Chat Support",
    accentClass: "bg-orange-100",
    iconClass: "text-orange-600",
    path: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
] as const;

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="AccessPath Admin Dashboard"
        description="Monitor operations, support activity, and performance trends."
        actions={
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-36" />
          </div>
        }
      />

      <section aria-label="KPI cards" className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`dashboard-kpi-${index}`} className="p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-3 h-4 w-36" />
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-2">
          <Card className="border-gray-200 bg-white shadow-sm">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-6 h-80 w-full rounded-xl" />
          </Card>
          <Card className="border-gray-200 bg-white shadow-sm">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-6 h-48 w-full rounded-xl" />
          </Card>
        </div>
        <Card className="border-gray-200 bg-white shadow-sm">
          <Skeleton className="h-6 w-40" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`dashboard-rec-${index}`} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>("30d");
  const [trendMetric, setTrendMetric] = useState<TrendMetric>("conversations");
  const [activeTrendIndex, setActiveTrendIndex] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [timeTick, setTimeTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTimeTick((prev) => prev + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/dashboard?range=${range}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Dashboard request failed with status ${response.status}.`);
        }

        const payload = (await response.json()) as DashboardApiResponse;
        setDashboardData(payload);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load dashboard data.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => controller.abort();
  }, [range, retryKey]);

  useEffect(() => {
    if (!dashboardData || dashboardData.trend.length === 0) {
      setActiveTrendIndex(null);
      return;
    }

    setActiveTrendIndex(dashboardData.trend.length - 1);
  }, [dashboardData?.generatedAt, dashboardData?.trend.length]);

  const selectedTrendMetric = useMemo(
    () => trendMetricOptions.find((option) => option.value === trendMetric) ?? trendMetricOptions[0],
    [trendMetric],
  );

  const trendMeta = useMemo(() => {
    const trend = dashboardData?.trend ?? [];
    if (trend.length === 0) {
      return {
        points: "",
        areaPoints: "",
        plottedPoints: [] as Array<{ x: number; y: number }>,
        minValue: 0,
        maxValue: 0,
        tickValues: [] as number[],
        lineBottom: 88,
      };
    }

    const values = trend.map((point) => point[trendMetric]);
    const rawMinValue = Math.min(...values);
    const rawMaxValue = Math.max(...values);
    const padding =
      trendMetric === "conversations"
        ? Math.max(1, rawMaxValue * 0.1)
        : Math.max(1, (rawMaxValue - rawMinValue || rawMaxValue || 1) * 0.15);
    const minValue = trendMetric === "conversations" ? 0 : Math.max(0, rawMinValue - padding);
    const maxValue = Math.max(minValue + 1, rawMaxValue + padding);
    const lineTop = 10;
    const lineBottom = 88;
    const step = trend.length > 1 ? 100 / (trend.length - 1) : 50;

    const plottedPoints = trend.map((point, index) => {
      const x = trend.length > 1 ? index * step : 50;
      const y = lineBottom - ((point[trendMetric] - minValue) / (maxValue - minValue)) * (lineBottom - lineTop);
      return { x, y };
    });

    const points = plottedPoints.map((point) => `${point.x},${point.y}`).join(" ");
    const firstPoint = plottedPoints[0];
    const lastPoint = plottedPoints[plottedPoints.length - 1];
    const areaPoints =
      firstPoint && lastPoint
        ? `${firstPoint.x},${lineBottom} ${points} ${lastPoint.x},${lineBottom}`
        : "";
    const tickCount = 4;
    const tickValues = Array.from({ length: tickCount }, (_, index) => {
      const ratio = index / Math.max(tickCount - 1, 1);
      return maxValue - (maxValue - minValue) * ratio;
    });

    return {
      points,
      areaPoints,
      plottedPoints,
      minValue,
      maxValue,
      tickValues,
      lineBottom,
    };
  }, [dashboardData, trendMetric]);

  const activeTrendDetail = useMemo(() => {
    if (!dashboardData || dashboardData.trend.length === 0) return null;

    const fallbackIndex = dashboardData.trend.length - 1;
    const pointIndex =
      activeTrendIndex !== null && activeTrendIndex >= 0 && activeTrendIndex < dashboardData.trend.length
        ? activeTrendIndex
        : fallbackIndex;
    const point = dashboardData.trend[pointIndex];
    const previousPoint = pointIndex > 0 ? dashboardData.trend[pointIndex - 1] : undefined;

    return {
      label: point.label,
      value: point[trendMetric],
      formattedValue: selectedTrendMetric.formatter(point[trendMetric]),
      comparison: formatTrendDelta(
        trendMetric,
        point[trendMetric],
        previousPoint?.[trendMetric],
      ),
      pointIndex,
    };
  }, [activeTrendIndex, dashboardData, selectedTrendMetric, trendMetric]);

  const formattedGeneratedAt = useMemo(() => dashboardData ? formatIsoAsAgo(dashboardData.generatedAt) : '', [dashboardData?.generatedAt, timeTick]);

  const tableRows = useMemo(() => dashboardData ? dashboardData.recentActivity.map((row) => ({
    key: row.id,
    cells: [
      row.id,
      row.customer,
      row.channel,
      row.issue,
      <Badge key={row.status} variant={badgeMetaForStatus(row.status).variant}>
        {badgeMetaForStatus(row.status).label}
      </Badge>,
      formatIsoAsAgo(row.updated),
    ],
  })) : [], [dashboardData?.recentActivity]);

  if (!dashboardData && loading) {
    return <DashboardSkeleton />;
  }

  if (!dashboardData && error) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="AccessPath Admin Dashboard"
          description="Monitor operations, support activity, and performance trends."
        />
        <Card className="border-gray-200 bg-white shadow-sm">
          <EmptyState
            title="Dashboard data could not be loaded"
            description={error}
            className="py-12"
          />
          <div className="mt-4 flex justify-center">
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => {
                setLoading(true);
                setError(null);
                setDashboardData(null);
                setRetryKey((current) => current + 1);
              }}
              type="button"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="AccessPath Admin Dashboard"
        description="Monitor operations, support activity, and performance trends."
        actions={
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600" htmlFor="date-range">
              Date Range
            </label>
            <select
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm"
              id="date-range"
              name="date-range"
              onChange={(event) => setRange(event.target.value as DashboardRange)}
              value={range}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            {loading ? <Badge variant="neutral">Updating...</Badge> : null}
          </div>
        }
      />

      {error ? (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <p className="text-sm font-medium text-amber-900">Dashboard refresh failed</p>
          <p className="mt-1 text-sm text-amber-800">{error}</p>
        </Card>
      ) : null}

      {!dashboardData.hasData ? (
        <Card className="border-sky-200 bg-sky-50/70 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-medium text-sky-900">No support records imported yet</p>
              <p className="mt-1 text-sm leading-6 text-sky-800">
                Add a few support records or import a CSV batch from Integrations to populate the dashboard, analytics, and insights views.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="rounded-md border border-sky-300 bg-white px-3 py-2 text-sm text-sky-800 transition hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2"
                href="/integrations"
              >
                Add Support Records
              </Link>
              <a
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                download
                href="/templates/support-records-mock.csv"
              >
                Download Sample CSV
              </a>
            </div>
          </div>
        </Card>
      ) : null}

      <section
        aria-label="KPI cards"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
      >
        {dashboardData.kpis.map((kpi, index) => {
          const accents = [
            "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
            "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
            "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
            "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
          ];

          return (
            <Card key={kpi.label} className={`relative overflow-hidden border ${accents[index % accents.length]} p-0 shadow-sm`}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-400" />
              <div className="p-5">
                <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">{kpi.value}</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  <span className="font-medium text-gray-950">{kpi.change}</span> {kpi.trend}
                </p>
              </div>
            </Card>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-2">
          <Card className="border-gray-200 bg-white shadow-sm">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                    <SectionIcon kind="trend" />
                  </span>
                  Performance
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">
                  {selectedTrendMetric.title}
                </h2>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-1">
                  {trendMetricOptions.map((option) => {
                    const active = option.value === trendMetric;

                    return (
                      <button
                        key={option.value}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          active
                            ? "bg-white text-gray-950 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                        onClick={() => setTrendMetric(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                  {formatRangeLabel(dashboardData.range)}
                </span>
              </div>
            </header>
            {dashboardData.hasData ? (
              <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-5 shadow-inner">
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Selected point
                    </p>
                    {activeTrendDetail ? (
                      <>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <span className="text-2xl font-semibold tracking-tight text-gray-950">
                            {activeTrendDetail.formattedValue}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                            {activeTrendDetail.label}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{activeTrendDetail.comparison}</p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-gray-600">Hover a point to inspect each interval.</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Y-Axis
                    </p>
                    <p className="mt-1 font-medium text-gray-900">{selectedTrendMetric.axisLabel}</p>
                  </div>
                </div>

                <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-4">
                  <div className="flex h-72 flex-col justify-between py-4 text-xs text-gray-500">
                    {trendMeta.tickValues.map((tick, index) => (
                      <span key={`trend-tick-label-${index}`} className="leading-none">
                        {selectedTrendMetric.formatter(tick)}
                      </span>
                    ))}
                  </div>

                  <div
                    aria-label={`Line chart showing ${selectedTrendMetric.title.toLowerCase()} over time`}
                    className="relative h-72 overflow-hidden rounded-xl border border-gray-200 bg-white p-4"
                    onMouseLeave={() =>
                      setActiveTrendIndex(
                        dashboardData.trend.length > 0 ? dashboardData.trend.length - 1 : null,
                      )
                    }
                  >
                    {trendMeta.tickValues.map((_, index) => (
                      <div
                        key={`trend-grid-y-${index}`}
                        className="absolute inset-x-4 border-t border-dashed border-gray-200"
                        style={{ top: `${(index / Math.max(trendMeta.tickValues.length - 1, 1)) * 100}%` }}
                      />
                    ))}
                    {trendMeta.plottedPoints.slice(1, -1).map((point, index) => (
                      <div
                        key={`trend-grid-x-${index}`}
                        className="absolute bottom-10 top-4 border-l border-dashed border-gray-200"
                        style={{ left: `${point.x}%` }}
                      />
                    ))}

                    <svg
                      aria-hidden="true"
                      className="absolute inset-4 h-full w-full"
                      viewBox="0 0 100 100"
                    >
                      <defs>
                        <linearGradient id="dashboard-trend-fill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <polygon
                        fill="url(#dashboard-trend-fill)"
                        points={trendMeta.areaPoints}
                        className="text-sky-700"
                      />
                      <polyline
                        fill="none"
                        points={trendMeta.points}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="text-sky-700"
                      />
                      {trendMeta.plottedPoints.map((point, index) => (
                        <circle
                          key={`trend-point-${dashboardData.trend[index]?.label ?? index}`}
                          cx={point.x}
                          cy={point.y}
                          r={activeTrendDetail?.pointIndex === index ? "2.8" : "2.2"}
                          className={activeTrendDetail?.pointIndex === index ? "fill-white stroke-sky-700" : "fill-sky-700"}
                          strokeWidth="1.6"
                        />
                      ))}
                    </svg>

                    <div className="absolute inset-4">
                      {trendMeta.plottedPoints.map((point, index) => {
                        const metricPoint = dashboardData.trend[index];
                        const active = activeTrendDetail?.pointIndex === index;

                        return (
                          <button
                            key={`trend-target-${metricPoint?.label ?? index}`}
                            aria-label={`${metricPoint?.label ?? "Point"}: ${selectedTrendMetric.formatter(metricPoint?.[trendMetric] ?? 0)}`}
                            className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full transition ${
                              active ? "ring-4 ring-sky-200/70" : "hover:ring-4 hover:ring-sky-100"
                            }`}
                            onFocus={() => setActiveTrendIndex(index)}
                            onMouseEnter={() => setActiveTrendIndex(index)}
                            style={{ left: `${point.x}%`, top: `${point.y}%` }}
                            type="button"
                          >
                            <span className="sr-only">
                              {metricPoint?.label}: {selectedTrendMetric.formatter(metricPoint?.[trendMetric] ?? 0)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="absolute inset-x-4 bottom-2 flex justify-between gap-2 text-xs text-gray-500">
                      {dashboardData.trend.map((point) => (
                        <span key={`trend-label-${point.label}`} className="text-center">
                          {point.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Trend data will appear after your first import"
                description="Import a CSV or add support records from Integrations to start seeing performance movement over time."
                className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16"
              />
            )}
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <span className="rounded-full bg-blue-100 p-2 text-blue-700">
                    <SectionIcon kind="table" />
                  </span>
                  Activity
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">
                  Recent Interactions
                </h2>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                {formattedGeneratedAt}
              </span>
            </header>
            {dashboardData.hasData ? (
              <Table
                ariaLabel="Recent customer interactions"
                columns={[
                  { key: "id", header: "ID" },
                  { key: "customer", header: "Customer" },
                  { key: "channel", header: "Channel" },
                  { key: "issue", header: "Issue" },
                  { key: "status", header: "Status" },
                  { key: "updated", header: "Updated" },
                ]}
                rows={tableRows}
              />
            ) : (
              <EmptyState
                title="Recent interactions will show up here"
                description="Once support records are imported, this table becomes a live queue snapshot of the latest customer issues."
                className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16"
              />
            )}
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-gray-200 bg-white shadow-sm">
            <header className="mb-6">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <span className="rounded-full bg-violet-100 p-2 text-violet-700">
                  <SectionIcon kind="ai" />
                </span>
                AI Guidance
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">
                AI Recommendations
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Data-driven insights to optimize your operations
              </p>
            </header>
            <ul className="space-y-4">
              {dashboardData.aiRecommendations.length > 0 ? (
                dashboardData.aiRecommendations.map((rec) => (
                  <li key={rec.id} className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
                    <Link
                      className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                      href={`/insights?focus=${encodeURIComponent(rec.id)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{rec.title}</h3>
                          <p className="mt-1 text-sm text-gray-600">{rec.description}</p>
                          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-sky-700">
                            Open in Insights
                          </p>
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-2">
                          <Badge
                            variant={
                              rec.impact === "High"
                                ? "success"
                                : rec.impact === "Medium"
                                  ? "warning"
                                  : "neutral"
                            }
                          >
                            {rec.impact} Impact
                          </Badge>
                          <span className="text-xs text-gray-500">{rec.category}</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  No active recommendations are available yet. Review or apply items from Insights to populate this panel.
                </li>
              )}
            </ul>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <header className="mb-6">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <span className="rounded-full bg-amber-100 p-2 text-amber-700">
                  <SectionIcon kind="signals" />
                </span>
                Queue Signals
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">
                Support Highlights
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Focused context pulled from the current support records.
              </p>
            </header>
            <div className="space-y-4">
              {dashboardData.summaries.map((summary, index) => {
                const accents = [
                  "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
                  "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
                ];

                return (
                  <div
                    key={summary.id}
                    className={`rounded-xl border ${accents[index % accents.length]} p-5`}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {summary.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
                      {summary.value}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{summary.helperText}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Card className="border-gray-200 bg-white shadow-sm">
        <header className="mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <span className="rounded-full bg-amber-100 p-2 text-amber-700">
              <SectionIcon kind="actions" />
            </span>
            Workflow
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Quick Actions</h2>
          <p className="mt-2 text-sm text-gray-600">
            Common tasks to manage your operations efficiently
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 text-center transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              href={action.href}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${action.accentClass}`}>
                <svg className={`h-6 w-6 ${action.iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.path} />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">{action.label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

