"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
  Toast,
} from "@/components/ui";
import { badgeMetaForLogisticsStatus } from "@/lib";
import { logisticsKpis, logisticsRoutes } from "@/lib/mock";
import type { LogisticsRegion, LogisticsRoute, LogisticsRouteStatus } from "@/types";

export default function LogisticsPage() {
  const [regionFilter, setRegionFilter] = useState<LogisticsRegion | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LogisticsRouteStatus | "all">("all");
  const [optimizing, setOptimizing] = useState(false);
  const [savingsEstimate, setSavingsEstimate] = useState(logisticsKpis[2]?.value ?? "$12.4K");
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

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

  const avgEta = useMemo(() => {
    if (filteredRoutes.length === 0) return 0;
    const total = filteredRoutes.reduce((sum, route) => sum + route.etaHours, 0);
    return Math.round((total / filteredRoutes.length) * 10) / 10;
  }, [filteredRoutes]);

  const onTimeCount = useMemo(
    () => filteredRoutes.filter((route) => route.status === "On Time").length,
    [filteredRoutes],
  );

  const tableRows = filteredRoutes.map((route: LogisticsRoute) => ({
    key: route.id,
    cells: [
      route.routeCode,
      route.origin,
      route.destination,
      route.region,
      `${route.etaHours}h`,
      `${route.loadUtilization}%`,
      route.stops.toLocaleString(),
      <Badge key={`${route.id}-status`} variant={badgeMetaForLogisticsStatus(route.status).variant}>
        {badgeMetaForLogisticsStatus(route.status).label}
      </Badge>,
    ],
  }));

  const kpis = [
    logisticsKpis[0],
    {
      label: "Avg ETA",
      value: `${avgEta}h`,
      helperText: "Across filtered routes",
    },
    {
      label: "Savings Estimate",
      value: savingsEstimate,
      helperText: `${onTimeCount} on-time route${onTimeCount === 1 ? "" : "s"} visible`,
    },
  ];

  const optimizeRoutes = () => {
    if (optimizing) return;
    setOptimizing(true);

    window.setTimeout(() => {
      setSavingsEstimate("$18.9K");
      setOptimizing(false);
      setToastMessage("Routes optimized.");
      setToastOpen(true);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <PageHeader
        title="Logistics"
        description="Track route performance, surface delays, and simulate optimization outcomes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600" htmlFor="logistics-region-filter">
              Region
            </label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              id="logistics-region-filter"
              onChange={(event) =>
                setRegionFilter(event.target.value as LogisticsRegion | "all")
              }
              value={regionFilter}
            >
              <option value="all">All regions</option>
              <option value="Midwest">Midwest</option>
              <option value="South">South</option>
              <option value="West">West</option>
              <option value="Northeast">Northeast</option>
            </select>

            <label className="text-sm text-gray-600" htmlFor="logistics-status-filter">
              Status
            </label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              id="logistics-status-filter"
              onChange={(event) =>
                setStatusFilter(event.target.value as LogisticsRouteStatus | "all")
              }
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="On Time">On Time</option>
              <option value="At Risk">At Risk</option>
              <option value="Delayed">Delayed</option>
            </select>

            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white"
              disabled={optimizing}
              onClick={optimizeRoutes}
              type="button"
            >
              {optimizing ? "Optimizing..." : "Optimize Routes"}
            </button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            helperText={kpi.helperText}
            label={kpi.label}
            value={kpi.value}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold">Network Map</h2>
            <p className="mt-1 text-sm text-gray-600">
              Placeholder map: route density, regional load, and delay hotspots.
            </p>
            <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
              <p className="text-sm text-gray-700">
                Visible routes:{" "}
                <span className="font-semibold">{filteredRoutes.length.toLocaleString()}</span>
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Current filtered average ETA: {avgEta}h
              </p>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Routes</h2>
              <p className="text-sm text-gray-500">
                {filteredRoutes.length} row{filteredRoutes.length === 1 ? "" : "s"}
              </p>
            </div>

            {tableRows.length > 0 ? (
              <Table
                ariaLabel="Logistics routes table"
                columns={[
                  { key: "route", header: "Route" },
                  { key: "origin", header: "Origin" },
                  { key: "destination", header: "Destination" },
                  { key: "region", header: "Region" },
                  { key: "eta", header: "ETA" },
                  { key: "load", header: "Load" },
                  { key: "stops", header: "Stops" },
                  { key: "status", header: "Status" },
                ]}
                rows={tableRows}
              />
            ) : (
              <div className="space-y-3">
                <EmptyState
                  description="Adjust region or status filters to see available routes."
                  title="No routes match your filters"
                />
                <button
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onClick={() => {
                    setRegionFilter("all");
                    setStatusFilter("all");
                  }}
                  type="button"
                >
                  Reset filters
                </button>
              </div>
            )}
          </Card>
        </div>

        <aside className="xl:col-span-1">
          <Card>
            <h2 className="text-lg font-semibold">Optimization Notes</h2>
            <p className="mt-1 text-sm text-gray-600">
              The route optimizer prioritizes ETA reduction, load balancing, and stop
              consolidation across visible routes.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
                Consolidate South region loads to reduce underutilized mileage.
              </li>
              <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
                Re-sequence West region deliveries to absorb the current delayed lane.
              </li>
              <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
                Shift one Midwest stop cluster earlier to protect on-time performance.
              </li>
            </ul>
          </Card>
        </aside>
      </section>
    </div>
  );
}
