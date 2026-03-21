"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, PageHeader, Toast } from "@/components/ui";
import { badgeMetaForLogisticsStatus } from "@/lib";
import { logisticsKpis, logisticsRoutes } from "@/lib/mock";
import type { LogisticsRegion, LogisticsRouteStatus } from "@/types";

const routeMeta: Record<
  string,
  {
    driver: string;
    etaLabel: string;
    progress: number;
    state: "active" | "delayed" | "pending";
    start: [number, number];
    mid: [number, number];
    end: [number, number];
  }
> = {
  "route-1001": { driver: "Sarah Jenkins", etaLabel: "2:45 PM", progress: 94, state: "active", start: [17, 24], mid: [40, 38], end: [68, 68] },
  "route-1002": { driver: "Mike Peterson", etaLabel: "1:15 PM", progress: 78, state: "active", start: [20, 30], mid: [42, 54], end: [73, 40] },
  "route-1003": { driver: "Elena Rodriguez", etaLabel: "4:20 PM", progress: 45, state: "delayed", start: [13, 46], mid: [39, 26], end: [77, 54] },
  "route-1004": { driver: "David Chen", etaLabel: "5:00 PM", progress: 28, state: "pending", start: [28, 16], mid: [55, 22], end: [80, 32] },
  "route-1005": { driver: "Maya Thompson", etaLabel: "6:10 PM", progress: 66, state: "delayed", start: [16, 60], mid: [47, 62], end: [72, 76] },
  "route-1006": { driver: "Owen Patel", etaLabel: "3:40 PM", progress: 84, state: "active", start: [31, 70], mid: [54, 52], end: [79, 61] },
};

const costTrend = [
  { label: "Mon", value: 88 },
  { label: "Tue", value: 85 },
  { label: "Wed", value: 97 },
  { label: "Thu", value: 74 },
  { label: "Fri", value: 70 },
  { label: "Sat", value: 78 },
  { label: "Sun", value: 72 },
];

function LogisticsIcon({
  kind,
}: {
  kind:
    | "truck"
    | "trend"
    | "fuel"
    | "clock"
    | "cost"
    | "map"
    | "spark"
    | "dispatch"
    | "support"
    | "plus"
    | "expand"
    | "filter";
}) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (kind === "truck") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M3 7h10v8H3z" />
        <path d="M13 10h3l3 3v2h-6z" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="17.5" cy="17.5" r="1.5" />
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

  if (kind === "fuel") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M7 5h6v14H7z" />
        <path d="M13 8h2.5l1.5 2v6a2 2 0 0 0 4 0v-4.5l-2-2" />
        <path d="M9.5 8.5h1" />
      </svg>
    );
  }

  if (kind === "clock") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </svg>
    );
  }

  if (kind === "cost") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 3v18" />
        <path d="M17 7.5c0-1.7-2.2-3-5-3s-5 1.3-5 3 2 2.6 5 3 5 1.3 5 3-2.2 3-5 3-5-1.3-5-3" />
      </svg>
    );
  }

  if (kind === "map") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20z" />
        <path d="M9 4v13.5" />
        <path d="M15 6.5V20" />
      </svg>
    );
  }

  if (kind === "spark") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
      </svg>
    );
  }

  if (kind === "dispatch") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M4 12h9" />
        <path d="m9 7 5 5-5 5" />
        <path d="M18 5v14" />
      </svg>
    );
  }

  if (kind === "support") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <circle cx="9" cy="10" r="3" />
        <path d="M4.5 18a5.5 5.5 0 0 1 9 0" />
        <path d="M16 9h4" />
        <path d="M18 7v4" />
      </svg>
    );
  }

  if (kind === "plus") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (kind === "expand") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M8 4H4v4" />
        <path d="m4 4 6 6" />
        <path d="M16 20h4v-4" />
        <path d="m20 20-6-6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M10 17h4" />
    </svg>
  );
}

function routeStrokeClass(status: LogisticsRouteStatus) {
  if (status === "Delayed") return "text-rose-500";
  if (status === "At Risk") return "text-amber-500";
  return "text-sky-500";
}

function routePillVariant(state: "active" | "delayed" | "pending") {
  if (state === "delayed") return "danger";
  if (state === "pending") return "neutral";
  return "success";
}

export default function LogisticsPage() {
  const [regionFilter, setRegionFilter] = useState<LogisticsRegion | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LogisticsRouteStatus | "all">("all");
  const [optimizing, setOptimizing] = useState(false);
  const [monthlySavings, setMonthlySavings] = useState(logisticsKpis[2]?.value ?? "$1,240");
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(logisticsRoutes[0]?.id ?? null);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const filteredRoutes = useMemo(() => {
    return logisticsRoutes.filter((route) => {
      if (regionFilter !== "all" && route.region !== regionFilter) return false;
      if (statusFilter !== "all" && route.status !== statusFilter) return false;
      return true;
    });
  }, [regionFilter, statusFilter]);

  useEffect(() => {
    if (filteredRoutes.length === 0) {
      setSelectedRouteId(null);
      return;
    }

    if (!selectedRouteId || !filteredRoutes.some((route) => route.id === selectedRouteId)) {
      setSelectedRouteId(filteredRoutes[0].id);
    }
  }, [filteredRoutes, selectedRouteId]);

  const selectedRoute = filteredRoutes.find((route) => route.id === selectedRouteId) ?? filteredRoutes[0] ?? null;

  const averageEta = useMemo(() => {
    if (filteredRoutes.length === 0) return 0;
    return filteredRoutes.reduce((sum, route) => sum + route.etaHours, 0) / filteredRoutes.length;
  }, [filteredRoutes]);

  const fleetEfficiency = useMemo(() => {
    if (filteredRoutes.length === 0) return "0.0%";
    const score =
      filteredRoutes.reduce((sum, route) => {
        if (route.status === "On Time") return sum + 1;
        if (route.status === "At Risk") return sum + 0.78;
        return sum + 0.52;
      }, 0) / filteredRoutes.length;
    return `${(score * 100).toFixed(1)}%`;
  }, [filteredRoutes]);

  const costPerStop = useMemo(() => {
    if (filteredRoutes.length === 0) return "$0.00";
    const totalStops = filteredRoutes.reduce((sum, route) => sum + route.stops, 0);
    const weightedCost = filteredRoutes.reduce(
      (sum, route) => sum + route.etaHours * 8.4 + route.loadUtilization * 0.34,
      0,
    );
    return `$${(weightedCost / Math.max(totalStops, 1)).toFixed(2)}`;
  }, [filteredRoutes]);

  const onlineCount = filteredRoutes.filter((route) => route.status !== "Delayed").length;
  const delayedCount = filteredRoutes.filter((route) => route.status === "Delayed").length;

  const activeSuggestion = useMemo(() => {
    const flaggedRoute =
      filteredRoutes.find((route) => route.status === "Delayed") ??
      filteredRoutes.find((route) => route.status === "At Risk");
    const backupRoute =
      filteredRoutes.find((route) => route.id !== flaggedRoute?.id && route.status === "On Time") ??
      filteredRoutes.find((route) => route.id !== flaggedRoute?.id);

    if (!flaggedRoute || !backupRoute) {
      return {
        title: "No major route conflicts detected",
        description: "Current fleet flow is stable. Use Optimize All to refresh stop sequencing and fuel planning.",
      };
    }

    return {
      title: `Route alert: ${flaggedRoute.routeCode}`,
      description: `Merging stop #3 with ${backupRoute.routeCode} could save 14 miles and reduce fuel burn by about $22.`,
    };
  }, [filteredRoutes]);

  const optimizeRoutes = () => {
    if (optimizing) return;
    setOptimizing(true);

    window.setTimeout(() => {
      setMonthlySavings("$1,840");
      setOptimizing(false);
      setToastMessage("Fleet optimization suggestions refreshed.");
      setToastOpen(true);
    }, 1400);
  };

  const triggerAction = (label: string) => {
    setToastMessage(`${label} queued.`);
    setToastOpen(true);
  };

  const kpiCards = [
    {
      label: "Fleet Efficiency",
      value: fleetEfficiency,
      helper: "+4.2% vs prior route plan",
      icon: "trend" as const,
      accentClass: "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
      iconClass: "bg-sky-100 text-sky-700",
    },
    {
      label: "Fuel Savings (Monthly)",
      value: monthlySavings,
      helper: "+12% optimization capture",
      icon: "fuel" as const,
      accentClass: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Avg. Delivery Time",
      value: `${averageEta.toFixed(1)}h`,
      helper: "-0.6h on filtered lanes",
      icon: "clock" as const,
      accentClass: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
      iconClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Cost Per Stop",
      value: costPerStop,
      helper: `Across ${filteredRoutes.reduce((sum, route) => sum + route.stops, 0)} planned stops`,
      icon: "cost" as const,
      accentClass: "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
      iconClass: "bg-violet-100 text-violet-700",
    },
  ];

  return (
    <div className="space-y-8">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <PageHeader
        title="AccessPath Logistics Center"
        description="Monitor fleet efficiency, route risk, and dispatch actions from a single live operations view."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success" className="px-3 py-1">
              Live fleet monitor
            </Badge>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onChange={(event) => setRegionFilter(event.target.value as LogisticsRegion | "all")}
              value={regionFilter}
            >
              <option value="all">All regions</option>
              <option value="Midwest">Midwest</option>
              <option value="South">South</option>
              <option value="West">West</option>
              <option value="Northeast">Northeast</option>
            </select>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onChange={(event) => setStatusFilter(event.target.value as LogisticsRouteStatus | "all")}
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="On Time">On Time</option>
              <option value="At Risk">At Risk</option>
              <option value="Delayed">Delayed</option>
            </select>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => triggerAction("Expanded fleet map")}
              type="button"
            >
              <LogisticsIcon kind="expand" />
              Expand Map
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={optimizing}
              onClick={optimizeRoutes}
              type="button"
            >
              <LogisticsIcon kind="spark" />
              {optimizing ? "Optimizing..." : "Optimize All"}
            </button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className={`relative overflow-hidden border ${card.accentClass} p-0 shadow-sm`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-400" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className={`rounded-xl p-2.5 ${card.iconClass}`}>
                  <LogisticsIcon kind={card.icon} />
                </div>
                <Badge variant="neutral" className="bg-white/80 text-gray-600">
                  Live
                </Badge>
              </div>
              <p className="mt-5 text-sm font-medium text-gray-600">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">{card.helper}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_290px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Routes</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-950">Manage real-time delivery flows</h2>
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => triggerAction("Created route hold")}
              type="button"
            >
              <LogisticsIcon kind="plus" />
            </button>
          </div>

          <Card className="border-sky-300 bg-gradient-to-br from-sky-50 to-white shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-sky-700">
              <span className="rounded-full bg-white p-2 text-sky-700 shadow-sm">
                <LogisticsIcon kind="spark" />
              </span>
              AI optimization available
            </div>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-gray-950">{activeSuggestion.title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">{activeSuggestion.description}</p>
            <button
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
              onClick={() => triggerAction("Applied route suggestion")}
              type="button"
            >
              Apply Suggestion
            </button>
          </Card>

          {filteredRoutes.length > 0 ? (
            filteredRoutes.map((route) => {
              const meta = routeMeta[route.id];
              const badgeMeta = badgeMetaForLogisticsStatus(route.status);

              return (
                <button
                  key={route.id}
                  className={`w-full rounded-xl border p-4 text-left shadow-sm transition ${
                    selectedRoute?.id === route.id
                      ? "border-sky-300 bg-sky-50/40"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedRouteId(route.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                        <LogisticsIcon kind="truck" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-950">{meta.driver}</p>
                        <p className="mt-1 text-xs text-gray-500">ID: {route.routeCode}</p>
                      </div>
                    </div>
                    <Badge variant={routePillVariant(meta.state)}>{meta.state}</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-500">
                    <span>{route.stops} stops</span>
                    <span>ETA: {meta.etaLabel}</span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Route progress</span>
                      <span className="font-medium text-gray-700">{meta.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${
                          route.status === "Delayed"
                            ? "from-rose-500 to-red-400"
                            : route.status === "At Risk"
                              ? "from-amber-400 to-orange-400"
                              : "from-sky-500 to-cyan-400"
                        }`}
                        style={{ width: `${meta.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Badge variant={badgeMeta.variant}>{badgeMeta.label}</Badge>
                    <span className="text-xs text-gray-500">{route.region}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <Card className="border-gray-200 bg-white shadow-sm">
              <EmptyState
                description="Adjust region or status filters to bring routes back into view."
                title="No active routes match the current filters"
              />
              <div className="mt-4 flex justify-center">
                <button
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onClick={() => {
                    setRegionFilter("all");
                    setStatusFilter("all");
                  }}
                  type="button"
                >
                  Reset filters
                </button>
              </div>
            </Card>
          )}
        </div>

        <Card className="border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <span className="rounded-full bg-gray-100 p-2 text-gray-700">
                  <LogisticsIcon kind="map" />
                </span>
                Live Fleet Monitor
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Route map and lane health</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {onlineCount} trucks online, {delayedCount} delayed, with AI monitoring stop sequencing in real time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{onlineCount} online</Badge>
              <Badge variant={delayedCount > 0 ? "warning" : "neutral"}>{delayedCount} delayed</Badge>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onClick={() => triggerAction("Filtered live fleet")}
                type="button"
              >
                <LogisticsIcon kind="filter" />
                Filter
              </button>
            </div>
          </div>

          <div className="relative mt-6 h-[640px] overflow-hidden rounded-2xl border border-gray-200 bg-[radial-gradient(circle_at_20%_20%,rgba(96,165,250,0.12),transparent_28%),radial-gradient(circle_at_80%_35%,rgba(148,163,184,0.12),transparent_26%),linear-gradient(180deg,#fafcff_0%,#f7fafc_100%)]">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute left-[8%] top-[10%] h-[82%] w-[84%] rounded-[40px] border border-dashed border-gray-200" />
              <div className="absolute left-[14%] top-[16%] h-[70%] w-[72%] rounded-[36px] border border-dashed border-gray-200" />
              <div className="absolute left-[20%] top-[22%] h-[58%] w-[60%] rounded-[32px] border border-dashed border-gray-200" />
              <div className="absolute left-[30%] top-[8%] h-[84%] w-px bg-gray-200/60" />
              <div className="absolute left-[56%] top-[10%] h-[78%] w-px bg-gray-200/60" />
              <div className="absolute left-[10%] top-[33%] h-px w-[80%] bg-gray-200/60" />
              <div className="absolute left-[12%] top-[58%] h-px w-[74%] bg-gray-200/60" />
            </div>

            <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
              {filteredRoutes.map((route) => {
                const meta = routeMeta[route.id];
                const path = `M ${meta.start[0]} ${meta.start[1]} Q ${meta.mid[0]} ${meta.mid[1]} ${meta.end[0]} ${meta.end[1]}`;

                return (
                  <g key={route.id} className={routeStrokeClass(route.status)}>
                    <path
                      d={path}
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={route.status === "Delayed" ? "2.5 2.5" : undefined}
                      strokeLinecap="round"
                      strokeWidth={selectedRoute?.id === route.id ? 1.8 : 1.1}
                    />
                    <circle cx={meta.start[0]} cy={meta.start[1]} fill="currentColor" r={1.3} />
                    <circle cx={meta.end[0]} cy={meta.end[1]} fill="currentColor" r={1.4} />
                  </g>
                );
              })}
            </svg>

            <div className="absolute right-4 top-4 flex flex-col gap-2">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onClick={() => triggerAction("Zoomed map in")}
                type="button"
              >
                <LogisticsIcon kind="plus" />
              </button>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onClick={() => triggerAction("Expanded map")}
                type="button"
              >
                <LogisticsIcon kind="expand" />
              </button>
            </div>

            <div className="absolute left-[24%] top-[42%] rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200">
              Traffic: 12m delay
            </div>
            <div className="absolute left-[44%] top-[74%] rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200">
              Delivered: Stop #4
            </div>

            <div className="absolute bottom-4 left-4 rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Live fleet status</p>
              <div className="mt-3 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  In transit
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  Idle / loading
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  Alert / delay
                </div>
              </div>
            </div>

            {selectedRoute ? (
              <div className="absolute bottom-4 right-4 max-w-[280px] rounded-xl border border-gray-200 bg-white/96 p-4 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-950">{routeMeta[selectedRoute.id].driver}</p>
                    <p className="mt-1 text-xs text-gray-500">{selectedRoute.routeCode} • {selectedRoute.region}</p>
                  </div>
                  <Badge variant={badgeMetaForLogisticsStatus(selectedRoute.status).variant}>
                    {badgeMetaForLogisticsStatus(selectedRoute.status).label}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Origin</p>
                    <p className="mt-1 font-medium text-gray-900">{selectedRoute.origin}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Destination</p>
                    <p className="mt-1 font-medium text-gray-900">{selectedRoute.destination}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">ETA</p>
                    <p className="mt-1 font-medium text-gray-900">{routeMeta[selectedRoute.id].etaLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Load</p>
                    <p className="mt-1 font-medium text-gray-900">{selectedRoute.loadUtilization}%</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Cost Efficiency Trend</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-950">Weekly cost per delivery unit</h2>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">7 day view</span>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4">
              <div className="flex h-40 items-end gap-3">
                {costTrend.map((item) => (
                  <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-full w-full items-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400"
                        style={{ height: `${item.value}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="rounded-full bg-blue-100 p-2 text-blue-700">
                <LogisticsIcon kind="dispatch" />
              </span>
              Quick Dispatch
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Next scheduled pickup</p>
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-950">Order #8829</p>
                  <p className="mt-1 text-sm text-gray-600">Auto-assign the next pickup to the best-fit route lead.</p>
                </div>
                <Badge variant="info">12:30 PM</Badge>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Assign to</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Mike P.", "Elena R.", "Sarah J."].map((name) => (
                  <button
                    key={name}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                    onClick={() => triggerAction(`Assigned ${name}`)}
                    type="button"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <Badge variant="info" className="mt-4">
              Auto-assign enabled
            </Badge>

            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
              onClick={() => triggerAction("Dispatch order")}
              type="button"
            >
              <LogisticsIcon kind="dispatch" />
              Dispatch Order
            </button>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="rounded-full bg-violet-100 p-2 text-violet-700">
                <LogisticsIcon kind="support" />
              </span>
              Driver Support
            </div>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gradient-to-br from-violet-50 to-white p-4">
              <p className="text-sm font-semibold text-gray-950">3 messages pending review</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                One driver requested a revised dock window and two route leads flagged loading delays for the afternoon shift.
              </p>
              <button
                className="mt-4 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onClick={() => triggerAction("Opened driver support queue")}
                type="button"
              >
                Review queue
              </button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
