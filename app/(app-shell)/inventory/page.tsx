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
import { badgeMetaForInventoryStatus } from "@/lib";
import { inventoryAiActions, inventoryItems, inventoryKpis } from "@/lib/mock";
import type { InventoryCategory, InventoryItem, InventoryStatus } from "@/types";

export default function InventoryPage() {
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory | "all">("all");
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      return true;
    });
  }, [categoryFilter, statusFilter]);

  const visibleUnits = useMemo(
    () => filteredItems.reduce((sum, item) => sum + item.stock, 0),
    [filteredItems],
  );

  const atRiskCount = useMemo(
    () => filteredItems.filter((item) => item.status !== "Healthy").length,
    [filteredItems],
  );

  const tableRows = filteredItems.map((item: InventoryItem) => ({
    key: item.id,
    cells: [
      item.sku,
      item.name,
      item.category,
      item.location,
      item.stock.toLocaleString(),
      item.reorderPoint.toLocaleString(),
      item.incomingUnits.toLocaleString(),
      <Badge key={`${item.id}-status`} variant={badgeMetaForInventoryStatus(item.status).variant}>
        {badgeMetaForInventoryStatus(item.status).label}
      </Badge>,
    ],
  }));

  const kpis = [
    inventoryKpis[0],
    {
      label: "Visible Units",
      value: visibleUnits.toLocaleString(),
      helperText: `${filteredItems.length} filtered item${filteredItems.length === 1 ? "" : "s"}`,
    },
    {
      label: "At-Risk Items",
      value: atRiskCount.toLocaleString(),
      helperText: "Low stock or critical inventory",
    },
  ];

  const applyAiAction = (title: string) => {
    setToastMessage(`Applied: ${title}`);
    setToastOpen(true);
  };

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <PageHeader
        title="Inventory"
        description="Monitor stock health, prioritize replenishment, and review recommended actions."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600" htmlFor="inventory-status-filter">
              Status
            </label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              id="inventory-status-filter"
              onChange={(event) =>
                setStatusFilter(event.target.value as InventoryStatus | "all")
              }
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Critical">Critical</option>
            </select>

            <label className="text-sm text-gray-600" htmlFor="inventory-category-filter">
              Category
            </label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              id="inventory-category-filter"
              onChange={(event) =>
                setCategoryFilter(event.target.value as InventoryCategory | "all")
              }
              value={categoryFilter}
            >
              <option value="all">All categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Apparel">Apparel</option>
              <option value="Home Goods">Home Goods</option>
              <option value="Office">Office</option>
            </select>
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
            <h2 className="text-lg font-semibold">Inventory Trend</h2>
            <p className="mt-1 text-sm text-gray-600">
              Placeholder chart: stock position and replenishment coverage over time.
            </p>
            <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
              <p className="text-sm text-gray-700">
                Filtered units on hand:{" "}
                <span className="font-semibold">{visibleUnits.toLocaleString()}</span>
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Critical and low-stock items currently visible: {atRiskCount}
              </p>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Stock</h2>
              <p className="text-sm text-gray-500">
                {filteredItems.length} row{filteredItems.length === 1 ? "" : "s"}
              </p>
            </div>

            {tableRows.length > 0 ? (
              <Table
                ariaLabel="Inventory stock table"
                columns={[
                  { key: "sku", header: "SKU" },
                  { key: "name", header: "Name" },
                  { key: "category", header: "Category" },
                  { key: "location", header: "Location" },
                  { key: "stock", header: "Stock" },
                  { key: "reorder", header: "Reorder Point" },
                  { key: "incoming", header: "Incoming" },
                  { key: "status", header: "Status" },
                ]}
                rows={tableRows}
              />
            ) : (
              <div className="space-y-3">
                <EmptyState
                  description="Try broadening your filters to view inventory rows."
                  title="No inventory matches your filters"
                />
                <button
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onClick={() => {
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
        </div>

        <aside className="xl:col-span-1">
          <Card>
            <h2 className="text-lg font-semibold">AI Actions</h2>
            <p className="mt-1 text-sm text-gray-600">
              Recommended operational moves based on current inventory conditions.
            </p>
            <div className="mt-4 space-y-3">
              {inventoryAiActions.map((action) => (
                <div
                  className="rounded-md border border-gray-200 bg-gray-50 p-3"
                  key={action.id}
                >
                  <p className="text-sm font-medium text-gray-900">{action.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{action.description}</p>
                  <p className="mt-2 text-xs text-gray-500">{action.impact}</p>
                  <button
                    className="mt-3 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                    onClick={() => applyAiAction(action.title)}
                    type="button"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </section>
    </div>
  );
}
