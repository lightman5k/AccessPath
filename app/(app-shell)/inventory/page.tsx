"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, PageHeader, Toast } from "@/components/ui";
import { badgeMetaForInventoryStatus } from "@/lib";
import { inventoryAiActions, inventoryItems } from "@/lib/mock";
import type { InventoryCategory, InventoryItem, InventoryStatus } from "@/types";

const trendData = [
  { label: "Jan", actual: 4200, forecast: 4350 },
  { label: "Feb", actual: 3180, forecast: 3400 },
  { label: "Mar", actual: 2140, forecast: 2320 },
  { label: "Apr", actual: 2860, forecast: 2740 },
  { label: "May", actual: 1980, forecast: 2200 },
  { label: "Jun", actual: 2430, forecast: 2570 },
  { label: "Jul", actual: 3510, forecast: 3380 },
];

const itemUnitValue: Record<string, number> = {
  "inv-1001": 620,
  "inv-1002": 180,
  "inv-1003": 28,
  "inv-1004": 95,
  "inv-1005": 410,
  "inv-1006": 780,
  "inv-1007": 22,
};

const impactMeta = [
  { label: "High Impact", variant: "danger" as const, confidence: "96% confidence" },
  { label: "Medium Impact", variant: "warning" as const, confidence: "92% confidence" },
  { label: "Low Impact", variant: "neutral" as const, confidence: "86% confidence" },
];

function InventoryIcon({
  kind,
}: {
  kind:
    | "trend"
    | "stock"
    | "alert"
    | "calendar"
    | "export"
    | "reorder"
    | "value"
    | "turnover"
    | "sku"
    | "clock";
}) {
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

  if (kind === "stock") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 3l8 4.5v9L12 21 4 16.5v-9L12 3z" />
        <path d="M12 12v9" />
        <path d="M12 12 4 7.5" />
        <path d="M12 12l8-4.5" />
      </svg>
    );
  }

  if (kind === "alert") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.3 4.6 3.9 16a2 2 0 0 0 1.7 3h12.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z" />
      </svg>
    );
  }

  if (kind === "calendar") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M8 3v3" />
        <path d="M16 3v3" />
        <rect x="4" y="6" width="16" height="14" rx="2" />
        <path d="M4 10h16" />
      </svg>
    );
  }

  if (kind === "export") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    );
  }

  if (kind === "reorder") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M7 7h11v11" />
        <path d="M7 17 18 6" />
        <path d="M6 11H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-2" />
      </svg>
    );
  }

  if (kind === "value") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 3v18" />
        <path d="M17 7.5c0-1.7-2.2-3-5-3s-5 1.3-5 3 2 2.6 5 3 5 1.3 5 3-2.2 3-5 3-5-1.3-5-3" />
      </svg>
    );
  }

  if (kind === "turnover") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M4 7h12" />
        <path d="m12 3 4 4-4 4" />
        <path d="M20 17H8" />
        <path d="m12 13-4 4 4 4" />
      </svg>
    );
  }

  if (kind === "sku") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function healthPercent(item: InventoryItem) {
  if (item.reorderPoint <= 0) return 100;
  return Math.min(100, Math.round((item.stock / Math.max(item.reorderPoint * 2, 1)) * 100));
}

function healthBarClass(status: InventoryStatus) {
  if (status === "Healthy") return "from-sky-500 to-cyan-400";
  if (status === "Low Stock") return "from-amber-400 to-orange-400";
  return "from-rose-500 to-red-400";
}

export default function InventoryPage() {
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timelineView, setTimelineView] = useState<"day" | "week" | "month">("month");
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return inventoryItems.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (query && !`${item.sku} ${item.name} ${item.category} ${item.location}`.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [categoryFilter, searchQuery, statusFilter]);

  const totalInventoryValue = useMemo(
    () => filteredItems.reduce((sum, item) => sum + item.stock * (itemUnitValue[item.id] ?? 80), 0),
    [filteredItems],
  );

  const activeSkuCount = filteredItems.length;
  const criticalCount = filteredItems.filter((item) => item.status === "Critical").length;
  const lowStockCount = filteredItems.filter((item) => item.status === "Low Stock").length;
  const averageTurnover = useMemo(() => {
    if (filteredItems.length === 0) return 0;
    return (
      filteredItems.reduce((sum, item) => sum + (item.incomingUnits + item.stock) / Math.max(item.reorderPoint, 1), 0) /
      filteredItems.length
    );
  }, [filteredItems]);

  const trendMax = Math.max(...trendData.flatMap((point) => [point.actual, point.forecast]));
  const actualPoints = trendData
    .map((point, index) => {
      const x = (index / (trendData.length - 1)) * 100;
      const y = 90 - (point.actual / trendMax) * 62;
      return `${x},${y}`;
    })
    .join(" ");
  const forecastPoints = trendData
    .map((point, index) => {
      const x = (index / (trendData.length - 1)) * 100;
      const y = 90 - (point.forecast / trendMax) * 62;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `${actualPoints} 100,100 0,100`;

  const applyAction = (label: string) => {
    setToastMessage(`${label} queued.`);
    setToastOpen(true);
  };

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        onClick={() => applyAction("Schedule review")}
        type="button"
      >
        <InventoryIcon kind="calendar" />
        Schedule Review
      </button>
      <button
        className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
        onClick={() => applyAction("Manual reorder")}
        type="button"
      >
        <InventoryIcon kind="reorder" />
        Manual Reorder
      </button>
    </div>
  );

  const kpiCards = [
    {
      label: "Total Inventory Value",
      value: formatCurrency(totalInventoryValue),
      helper: "+12.5% vs last month",
      icon: "value" as const,
      accentClass: "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
      iconClass: "bg-sky-100 text-sky-700",
    },
    {
      label: "Inventory Turnover",
      value: `${averageTurnover.toFixed(1)}x`,
      helper: "+0.8% vs prior cycle",
      icon: "turnover" as const,
      accentClass: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Active SKU Count",
      value: formatCompactNumber(activeSkuCount),
      helper: `${lowStockCount} items need monitoring`,
      icon: "sku" as const,
      accentClass: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
      iconClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Out of Stock Risks",
      value: formatCompactNumber(criticalCount),
      helper: "-4% vs last review",
      icon: "clock" as const,
      accentClass: "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
      iconClass: "bg-violet-100 text-violet-700",
    },
  ];

  return (
    <div className="space-y-8">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <PageHeader
        title="AccessPath Inventory & Operations"
        description="AI-powered tracking, predictive restocking, and shift optimization."
        actions={headerActions}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className={`relative overflow-hidden border ${card.accentClass} p-0 shadow-sm`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-400" />
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClass}`}>
                  <InventoryIcon kind={card.icon} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-gray-950">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">{card.helper}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <Card className="border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                  <InventoryIcon kind="trend" />
                </span>
                Performance
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-gray-950">Inventory Trend Analysis</h2>
                <Badge variant="info" className="px-3 py-1">
                  AI live prediction
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Stock volume levels versus predictive demand forecast.
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
              {(["day", "week", "month"] as const).map((view) => (
                <button
                  key={view}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] ${
                    timelineView === view ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                  onClick={() => setTimelineView(view)}
                  type="button"
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mt-6 h-[360px] overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4">
            <div className="absolute inset-x-4 top-[24%] border-t border-gray-200" />
            <div className="absolute inset-x-4 top-[46%] border-t border-gray-200" />
            <div className="absolute inset-x-4 top-[68%] border-t border-gray-200" />

            <svg aria-hidden="true" className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="inventoryArea" x1="50" x2="50" y1="0" y2="100">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.04" />
                </linearGradient>
              </defs>
              <polygon fill="url(#inventoryArea)" points={areaPoints} />
              <polyline
                fill="none"
                points={actualPoints}
                stroke="#1D9BF0"
                strokeLinecap="round"
                strokeWidth="2.1"
              />
              <polyline
                fill="none"
                points={forecastPoints}
                stroke="#7FB9F8"
                strokeDasharray="2.8 2.8"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>

            <div className="absolute bottom-5 left-4 right-4 flex justify-between text-xs text-gray-500">
              {trendData.map((point) => (
                <span key={point.label}>{point.label}</span>
              ))}
            </div>

            <div className="absolute bottom-12 left-4 flex items-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                Actual Levels
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-4 border-t-2 border-dashed border-sky-300" />
                AI Forecast
              </span>
            </div>
          </div>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <span className="rounded-full bg-violet-100 p-2 text-violet-700">
                  <InventoryIcon kind="alert" />
                </span>
                AI Guidance
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">AI Action Center</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Critical interventions suggested by AI Sentinel.
              </p>
            </div>
            <Badge variant="neutral" className="px-3 py-1">
              12 queued
            </Badge>
          </div>

          <div className="mt-5 space-y-4">
            {inventoryAiActions.map((action, index) => {
              const impact = impactMeta[index % impactMeta.length];

              return (
                <div key={action.id} className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="info" className="px-2.5 py-1">
                          AI Insight
                        </Badge>
                        <Badge variant={impact.variant}>{impact.label}</Badge>
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-gray-950">{action.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{action.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-gray-500">{impact.confidence}</span>
                    <button
                      className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 transition hover:text-sky-800"
                      onClick={() => applyAction(action.title)}
                      type="button"
                    >
                      Apply
                      <span>&gt;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="mt-5 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            onClick={() => applyAction("Review AI recommendations")}
            type="button"
          >
            View All Recommendations
          </button>
        </Card>
      </section>

      <Card className="border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="rounded-full bg-blue-100 p-2 text-blue-700">
                <InventoryIcon kind="stock" />
              </span>
              Operations
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Stock Optimization Control</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Manage individual SKUs and approve AI-generated replenishment orders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm">
              <svg
                aria-hidden="true"
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                className="w-48 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Filter by SKU or name..."
                type="text"
                value={searchQuery}
              />
            </div>

            <select
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onChange={(event) => setStatusFilter(event.target.value as InventoryStatus | "all")}
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Critical">Critical</option>
            </select>

            <select
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onChange={(event) => setCategoryFilter(event.target.value as InventoryCategory | "all")}
              value={categoryFilter}
            >
              <option value="all">All categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Apparel">Apparel</option>
              <option value="Home Goods">Home Goods</option>
              <option value="Office">Office</option>
            </select>

            <button
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => applyAction("Export inventory CSV")}
              type="button"
            >
              <InventoryIcon kind="export" />
              Export CSV
            </button>
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50/40 p-1">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  {[
                    "SKU ID",
                    "Product Name",
                    "Category",
                    "Current Level",
                    "Stock Health",
                    "AI Recommendation",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="border-b border-gray-200 px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500"
                      scope="col"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredItems.map((item) => {
                  const badgeMeta = badgeMetaForInventoryStatus(item.status);
                  const percent = healthPercent(item);
                  const recommendation =
                    item.status === "Critical"
                      ? `Order ${Math.max(item.reorderPoint * 2 - item.stock, 10)} units`
                      : item.status === "Low Stock"
                        ? `Shift ${Math.max(item.reorderPoint - item.stock, 8)} units`
                        : "Healthy";

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80">
                      <td className="border-b border-gray-100 px-3 py-4 text-sm font-medium text-gray-600">{item.sku}</td>
                      <td className="border-b border-gray-100 px-3 py-4">
                        <div>
                          <p className="font-medium text-gray-950">{item.name}</p>
                          <p className="mt-1 text-xs text-gray-500">{item.location}</p>
                        </div>
                      </td>
                      <td className="border-b border-gray-100 px-3 py-4">
                        <Badge variant="neutral">{item.category}</Badge>
                      </td>
                      <td className="border-b border-gray-100 px-3 py-4 text-gray-700">
                        {item.stock.toLocaleString()}
                      </td>
                      <td className="border-b border-gray-100 px-3 py-4">
                        <div className="flex min-w-[150px] items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${healthBarClass(item.status)}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-500">{percent}%</span>
                        </div>
                      </td>
                      <td className="border-b border-gray-100 px-3 py-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={badgeMeta.variant}>{badgeMeta.label}</Badge>
                          <span className="text-sm text-gray-600">{recommendation}</span>
                        </div>
                      </td>
                      <td className="border-b border-gray-100 px-3 py-4">
                        <button
                          className="text-sm font-medium text-sky-700 transition hover:text-sky-800"
                          onClick={() => applyAction(`Approve ${item.sku}`)}
                          type="button"
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between gap-4 px-3 py-4 text-sm text-gray-500">
              <p>
                Showing {filteredItems.length} of {inventoryItems.length} active inventory SKUs
              </p>
              <div className="flex items-center gap-2">
                <button className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-500" type="button">
                  Previous
                </button>
                <button className="rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-gray-700" type="button">
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <EmptyState
              description="Try broadening your search or filter settings to view more SKUs."
              title="No inventory matches your current view"
            />
            <button
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
              type="button"
            >
              Clear filters
            </button>
          </div>
        )}
      </Card>

      <Card className="border-sky-200 bg-gradient-to-r from-sky-50 to-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-100">
              <InventoryIcon kind="calendar" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-gray-950">Upcoming Operational Peak</h2>
                <Badge variant="info">Thursday / May 23</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
                AI analysis predicts a heavy shipment arrival window with a 20% surge in inbound warehouse traffic.
                AccessPath suggests adjusting associate hours to front-load logistics tasks before 10 AM.
              </p>
            </div>
          </div>

          <button
            className="inline-flex items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
            onClick={() => applyAction("Update shift schedule")}
            type="button"
          >
            Update Shift Schedule
          </button>
        </div>
      </Card>
    </div>
  );
}
