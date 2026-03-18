"use client";

import { useMemo, useState } from "react";
import { Badge, Card, PageHeader, StatCard, Table } from "@/components/ui";

type TimeframeOption = "7d" | "30d" | "90d";
type ChannelOption = "all" | "Web Chat" | "Email" | "SMS";
type CategoryOption = "all" | "Delivery" | "Returns" | "Billing" | "Account";

type TrendPoint = {
  label: string;
  conversations: number;
  resolutionRate: number;
  responseMinutes: number;
};

type BreakdownItem = {
  label: string;
  share: string;
  volume: string;
  trend: string;
};

type RecentSnapshot = {
  id: string;
  snapshot: string;
  summary: string;
  status: "Ready" | "Alert" | "Review";
  updatedAt: string;
};

const timeframeOptions: { value: TimeframeOption; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const trendDataByTimeframe: Record<TimeframeOption, TrendPoint[]> = {
  "7d": [
    { label: "Mon", conversations: 318, resolutionRate: 72, responseMinutes: 4.4 },
    { label: "Tue", conversations: 336, resolutionRate: 74, responseMinutes: 4.1 },
    { label: "Wed", conversations: 351, resolutionRate: 76, responseMinutes: 3.9 },
    { label: "Thu", conversations: 364, resolutionRate: 77, responseMinutes: 3.7 },
    { label: "Fri", conversations: 389, resolutionRate: 79, responseMinutes: 3.5 },
    { label: "Sat", conversations: 342, resolutionRate: 78, responseMinutes: 3.8 },
    { label: "Sun", conversations: 327, resolutionRate: 80, responseMinutes: 3.6 },
  ],
  "30d": [
    { label: "Week 1", conversations: 2210, resolutionRate: 73, responseMinutes: 4.6 },
    { label: "Week 2", conversations: 2345, resolutionRate: 75, responseMinutes: 4.2 },
    { label: "Week 3", conversations: 2498, resolutionRate: 77, responseMinutes: 3.9 },
    { label: "Week 4", conversations: 2621, resolutionRate: 79, responseMinutes: 3.6 },
  ],
  "90d": [
    { label: "Jan", conversations: 8910, resolutionRate: 70, responseMinutes: 5.1 },
    { label: "Feb", conversations: 9420, resolutionRate: 74, responseMinutes: 4.4 },
    { label: "Mar", conversations: 10180, resolutionRate: 79, responseMinutes: 3.7 },
  ],
};

const breakdownByChannel: Record<Exclude<ChannelOption, "all">, BreakdownItem[]> = {
  "Web Chat": [
    { label: "Delivery status", share: "38%", volume: "1,420", trend: "Up 9%" },
    { label: "Returns and refunds", share: "24%", volume: "895", trend: "Up 4%" },
    { label: "Account access", share: "19%", volume: "712", trend: "Flat" },
    { label: "Billing questions", share: "11%", volume: "408", trend: "Down 3%" },
  ],
  Email: [
    { label: "Returns and refunds", share: "31%", volume: "640", trend: "Up 6%" },
    { label: "Delivery status", share: "27%", volume: "558", trend: "Up 3%" },
    { label: "Billing questions", share: "21%", volume: "433", trend: "Flat" },
    { label: "Account access", share: "14%", volume: "289", trend: "Down 2%" },
  ],
  SMS: [
    { label: "Delivery status", share: "46%", volume: "510", trend: "Up 12%" },
    { label: "Account access", share: "18%", volume: "199", trend: "Flat" },
    { label: "Returns and refunds", share: "17%", volume: "188", trend: "Up 5%" },
    { label: "Billing questions", share: "9%", volume: "100", trend: "Down 1%" },
  ],
};

const recentSnapshots: RecentSnapshot[] = [
  {
    id: "snapshot-1",
    snapshot: "Daily operations summary",
    summary: "AI resolution rate reached 79%, driven by stronger shipping-delay handling and fewer repeat contacts.",
    status: "Ready",
    updatedAt: "Today, 8:15 AM",
  },
  {
    id: "snapshot-2",
    snapshot: "Channel performance alert",
    summary: "Web chat delivery-status conversations increased above expected range after a fulfillment update lag.",
    status: "Alert",
    updatedAt: "Today, 7:40 AM",
  },
  {
    id: "snapshot-3",
    snapshot: "Weekly leadership recap",
    summary: "Automation recommendations suggest 17.2 hours of weekly operational savings if approved response flows are applied.",
    status: "Review",
    updatedAt: "Yesterday, 4:30 PM",
  },
];

function statusVariant(status: RecentSnapshot["status"]) {
  if (status === "Ready") return "success";
  if (status === "Alert") return "warning";
  return "info";
}

function KpiIcon({ kind }: { kind: "volume" | "resolution" | "speed" | "impact" }) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (kind === "volume") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" {...commonProps}>
        <path d="M4 19h16" />
        <path d="M7 16V9" />
        <path d="M12 16V5" />
        <path d="M17 16v-7" />
      </svg>
    );
  }

  if (kind === "resolution") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="m9.5 12.5 1.7 1.7 3.6-4.2" />
      </svg>
    );
  }

  if (kind === "speed") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.5 1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" {...commonProps}>
      <path d="M12 4v16" />
      <path d="M7.5 8.5 12 4l4.5 4.5" />
      <path d="M7.5 15.5 12 20l4.5-4.5" />
    </svg>
  );
}

function SectionIcon({ kind }: { kind: "filters" | "trend" | "breakdown" | "reports" }) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (kind === "filters") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M4 7h16" />
        <path d="M7 12h10" />
        <path d="M10 17h4" />
      </svg>
    );
  }

  if (kind === "trend") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M4 16 9 11l3 3 8-8" />
        <path d="M15 6h5v5" />
      </svg>
    );
  }

  if (kind === "breakdown") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 3v9h9" />
        <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
      <path d="M7 4.5h10" />
      <path d="M7 9.5h10" />
      <path d="M7 14.5h6" />
      <path d="M5 4.5h.01" />
      <path d="M5 9.5h.01" />
      <path d="M5 14.5h.01" />
    </svg>
  );
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<TimeframeOption>("30d");
  const [channel, setChannel] = useState<ChannelOption>("all");
  const [category, setCategory] = useState<CategoryOption>("all");

  const trendPoints = trendDataByTimeframe[timeframe];

  const summaryCards = useMemo(() => {
    const totalConversations = trendPoints.reduce((sum, point) => sum + point.conversations, 0);
    const averageResolutionRate =
      trendPoints.reduce((sum, point) => sum + point.resolutionRate, 0) / trendPoints.length;
    const averageResponseTime =
      trendPoints.reduce((sum, point) => sum + point.responseMinutes, 0) / trendPoints.length;

    const automationImpact =
      timeframe === "7d" ? "4.8 hrs/week" : timeframe === "30d" ? "17.2 hrs/week" : "51.6 hrs/quarter";

    return [
      {
        icon: "volume" as const,
        label: "Total conversations",
        value: totalConversations.toLocaleString(),
        helperText: `${timeframeOptions.find((item) => item.value === timeframe)?.label} across tracked support activity.`,
        accentClass: "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
        iconClass: "bg-sky-100 text-sky-700",
      },
      {
        icon: "resolution" as const,
        label: "AI resolution rate",
        value: `${averageResolutionRate.toFixed(0)}%`,
        helperText: "Resolved without manual agent intervention.",
        accentClass: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
        iconClass: "bg-emerald-100 text-emerald-700",
      },
      {
        icon: "speed" as const,
        label: "Average response time",
        value: `${averageResponseTime.toFixed(1)} min`,
        helperText: "Mean first-response speed across active channels.",
        accentClass: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
        iconClass: "bg-amber-100 text-amber-700",
      },
      {
        icon: "impact" as const,
        label: "Automation impact",
        value: automationImpact,
        helperText: "Estimated effort reduction from current AI workflows and recommendations.",
        accentClass: "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
        iconClass: "bg-violet-100 text-violet-700",
      },
    ];
  }, [timeframe, trendPoints]);

  const maxConversationValue = Math.max(...trendPoints.map((point) => point.conversations));
  const averageResolutionRate =
    trendPoints.reduce((sum, point) => sum + point.resolutionRate, 0) / trendPoints.length;
  const averageResponseTime =
    trendPoints.reduce((sum, point) => sum + point.responseMinutes, 0) / trendPoints.length;

  const operationalBreakdown = useMemo(() => {
    const sourceItems =
      channel === "all"
        ? [
            { label: "Delivery status", share: "36%", volume: "2,488", trend: "Up 8%" },
            { label: "Returns and refunds", share: "25%", volume: "1,726", trend: "Up 4%" },
            { label: "Account access", share: "17%", volume: "1,173", trend: "Flat" },
            { label: "Billing questions", share: "13%", volume: "902", trend: "Down 2%" },
          ]
        : breakdownByChannel[channel];

    if (category === "all") return sourceItems;
    return sourceItems.filter((item) => {
      const normalized = item.label.toLowerCase();
      return normalized.includes(category.toLowerCase());
    });
  }, [category, channel]);

  const snapshotRows = recentSnapshots.map((item) => ({
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
  }));

  return (
    <div className="space-y-7">
      <PageHeader
        title="AccessPath Analytics Dashboard"
        description="Track support volume, AI performance, and recent reporting snapshots from a single MVP reporting view."
        actions={<Badge variant="info" className="px-3 py-1">Demo reporting mode</Badge>}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`relative overflow-hidden border ${card.accentClass} p-0 shadow-sm`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-400" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className={`rounded-xl p-2.5 ${card.iconClass}`}>
                  <KpiIcon kind={card.icon} />
                </div>
                <Badge variant="neutral" className="bg-white/80 text-gray-600">
                  Live
                </Badge>
              </div>
              <p className="mt-5 text-sm font-medium text-gray-600">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">{card.helperText}</p>
            </div>
          </Card>
        ))}
      </section>

      <Card className="border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="rounded-full bg-gray-100 p-2 text-gray-700">
                <SectionIcon kind="filters" />
              </span>
              Controls
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Reporting Filters</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Narrow the analytics view by timeframe, channel, and issue category.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-600" htmlFor="analytics-timeframe">
                Timeframe
              </label>
              <select
                id="analytics-timeframe"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
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
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onChange={(event) => setChannel(event.target.value as ChannelOption)}
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
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onChange={(event) => setCategory(event.target.value as CategoryOption)}
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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <Card className="border-gray-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                  <SectionIcon kind="trend" />
                </span>
                Performance
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Performance Trend</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Conversation volume, AI resolution, and response speed over the selected reporting period.
              </p>
            </div>
            <Badge variant="success" className="px-3 py-1">Stable improvement</Badge>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_280px]">
            <div>
              <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-5 shadow-inner">
                <div className="flex h-64 items-end gap-3">
                  {trendPoints.map((point) => {
                    const height = `${Math.max(18, (point.conversations / maxConversationValue) * 100)}%`;
                    return (
                      <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
                        <div className="flex h-full w-full items-end">
                          <div className="w-full rounded-t-lg bg-gradient-to-t from-gray-900 via-gray-800 to-gray-600 shadow-sm" style={{ height }} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">{point.label}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {point.conversations.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Resolution trend
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
                  {averageResolutionRate.toFixed(0)}%
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Average AI-led resolution across the selected period.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Support performance
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
                  {averageResponseTime.toFixed(1)} min
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Average response speed, improving as automation coverage expands.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Executive note
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  The strongest performance gains are coming from better handling of delivery-status questions and fewer agent takeovers in repeat support flows.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <span className="rounded-full bg-blue-100 p-2 text-blue-700">
                  <SectionIcon kind="breakdown" />
                </span>
                Operations
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Operational Breakdown</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Business-friendly view of where support demand is coming from and how it is changing.
              </p>
            </div>
            <Badge variant="info" className="px-3 py-1">
              {channel === "all" ? "All channels" : channel}
            </Badge>
          </div>

          <div className="mt-5 space-y-4">
            {operationalBreakdown.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 transition hover:border-gray-300">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-950">{item.label}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Share of conversations in the current filtered view.
                    </p>
                  </div>
                  <Badge variant="neutral" className="bg-white text-gray-600">{item.trend}</Badge>
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
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="border-gray-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="rounded-full bg-violet-100 p-2 text-violet-700">
                <SectionIcon kind="reports" />
              </span>
              Reporting
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Recent Reports &amp; Activity</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Latest reporting snapshots, alerts, and executive-ready summaries.
            </p>
          </div>
          <Badge variant="neutral" className="px-3 py-1 bg-gray-100 text-gray-700">3 recent updates</Badge>
        </div>

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
      </Card>
    </div>
  );
}
