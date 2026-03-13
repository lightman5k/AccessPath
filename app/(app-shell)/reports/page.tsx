"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  StatCard,
  Table,
  Toast,
} from "@/components/ui";
import { badgeMetaForReportModule } from "@/lib";
import {
  dateRangeOptions,
  featureRequirements,
  hasFeatureAccess,
  moduleOptions,
  reportData,
  saveMockSession,
  useMockSession,
} from "@/lib/mock";
import type { DateRange, ModuleFilter } from "@/types";

function daysForRange(range: DateRange): number {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  return 90;
}

function formatDate(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString();
}

export default function ReportsPage() {
  const session = useMockSession();
  const [referenceNow] = useState(() => Date.now());
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("all");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [pdfLockedOpen, setPdfLockedOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const filteredReports = useMemo(() => {
    const days = daysForRange(dateRange);
    const cutoffMs = referenceNow - days * 24 * 60 * 60 * 1000;

    return reportData
      .filter((item) => {
        const createdMs = Date.parse(item.createdAt);
        if (Number.isNaN(createdMs) || createdMs < cutoffMs) return false;
        if (moduleFilter !== "all" && item.module !== moduleFilter) return false;
        return true;
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [dateRange, moduleFilter, referenceNow]);

  const kpiSummary = useMemo(() => {
    if (filteredReports.length === 0) {
      return {
        totalEvents: 0,
        avgCompletionRate: 0,
        totalErrors: 0,
      };
    }

    const totalEvents = filteredReports.reduce((sum, item) => sum + item.totalEvents, 0);
    const totalErrors = filteredReports.reduce((sum, item) => sum + item.errors, 0);
    const avgCompletionRate = Math.round(
      filteredReports.reduce((sum, item) => sum + item.completionRate, 0) / filteredReports.length,
    );

    return { totalEvents, avgCompletionRate, totalErrors };
  }, [filteredReports]);

  const moduleMix = useMemo(() => {
    const counts: Record<Exclude<ModuleFilter, "all">, number> = {
      "Workflow Builder": 0,
      "Customer Service": 0,
      Integrations: 0,
    };

    filteredReports.forEach((item) => {
      counts[item.module] += 1;
    });

    return counts;
  }, [filteredReports]);

  const tableRows = filteredReports.map((item) => ({
    key: item.id,
    cells: [
      item.id,
      item.name,
      <Badge key={`${item.id}-module`} variant={badgeMetaForReportModule(item.module).variant}>
        {badgeMetaForReportModule(item.module).label}
      </Badge>,
      formatDate(item.createdAt),
      item.totalEvents.toLocaleString(),
      `${item.completionRate}%`,
      item.errors.toLocaleString(),
    ],
  }));

  const exportReport = (format: "CSV" | "PDF") => {
    if (format === "PDF" && !hasFeatureAccess(session, "pdfExport")) {
      setPdfLockedOpen(true);
      return;
    }
    setToastMessage(`Export started: ${format}`);
    setToastOpen(true);
  };

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <PageHeader
        title="Reports"
        description="Review module performance, reliability, and recent analytics snapshots."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600" htmlFor="reports-date-range">
              Date Range
            </label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              id="reports-date-range"
              onChange={(event) => setDateRange(event.target.value as DateRange)}
              value={dateRange}
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="text-sm text-gray-600" htmlFor="reports-module-filter">
              Module
            </label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              id="reports-module-filter"
              onChange={(event) => setModuleFilter(event.target.value as ModuleFilter)}
              value={moduleFilter}
            >
              {moduleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => exportReport("CSV")}
              type="button"
            >
              Export CSV
            </button>
            <button
              className={`rounded-md border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
                hasFeatureAccess(session, "pdfExport")
                  ? "border-gray-300 text-gray-700 hover:bg-gray-100"
                  : "border-dashed border-gray-300 text-gray-500 hover:bg-gray-50"
              }`}
              onClick={() => exportReport("PDF")}
              type="button"
            >
              {hasFeatureAccess(session, "pdfExport") ? "Export PDF" : "Export PDF (Premium)"}
            </button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total Events"
          value={kpiSummary.totalEvents.toLocaleString()}
          helperText={`${filteredReports.length} report${filteredReports.length === 1 ? "" : "s"} included`}
        />
        <StatCard
          label="Avg Completion Rate"
          value={`${kpiSummary.avgCompletionRate}%`}
          helperText="Across filtered report set"
        />
        <StatCard
          label="Total Errors"
          value={kpiSummary.totalErrors.toLocaleString()}
          helperText="Flagged failures from recent runs"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Volume Trend</h2>
          <p className="mt-1 text-sm text-gray-600">
            Placeholder chart: event volume over the selected date range.
          </p>
          <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              Current total event volume:{" "}
              <span className="font-semibold">{kpiSummary.totalEvents.toLocaleString()}</span>
            </p>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Module Mix</h2>
          <p className="mt-1 text-sm text-gray-600">
            Placeholder chart: report distribution by module.
          </p>
          <ul className="mt-4 space-y-2">
            <li className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <span>Workflow Builder</span>
              <span className="font-semibold">{moduleMix["Workflow Builder"]}</span>
            </li>
            <li className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <span>Customer Service</span>
              <span className="font-semibold">{moduleMix["Customer Service"]}</span>
            </li>
            <li className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <span>Integrations</span>
              <span className="font-semibold">{moduleMix.Integrations}</span>
            </li>
          </ul>
        </Card>
      </section>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Reports</h2>
          <p className="text-sm text-gray-500">
            {filteredReports.length} row{filteredReports.length === 1 ? "" : "s"}
          </p>
        </div>

        {tableRows.length > 0 ? (
          <Table
            ariaLabel="Recent analytics reports"
            columns={[
              { key: "id", header: "ID" },
              { key: "name", header: "Name" },
              { key: "module", header: "Module" },
              { key: "createdAt", header: "Created" },
              { key: "events", header: "Events" },
              { key: "completion", header: "Completion" },
              { key: "errors", header: "Errors" },
            ]}
            rows={tableRows}
          />
        ) : (
          <div className="space-y-3">
            <EmptyState
              title="No reports match your filters"
              description="Try resetting filters to view available analytics reports."
            />
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => {
                setDateRange("30d");
                setModuleFilter("all");
              }}
              type="button"
            >
              Reset filters
            </button>
          </div>
        )}
      </Card>

      <Modal
        footer={
          <>
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => setPdfLockedOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-md border border-indigo-300 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
              onClick={() => {
                saveMockSession({ ...session, plan: "premium" });
                setPdfLockedOpen(false);
                setToastMessage("Mock plan switched to premium.");
                setToastOpen(true);
              }}
              type="button"
            >
              Upgrade to Premium
            </button>
          </>
        }
        onClose={() => setPdfLockedOpen(false)}
        open={pdfLockedOpen}
        title="Premium Feature"
      >
        <p className="text-sm text-gray-700">{featureRequirements.pdfExport.description}</p>
      </Modal>
    </div>
  );
}
