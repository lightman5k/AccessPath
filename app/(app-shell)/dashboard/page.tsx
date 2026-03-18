import { dashboardAiRecommendations, dashboardInteractions, dashboardKpis } from "@/lib/mock";
import { Badge, Card, PageHeader, Table } from "@/components/ui";
import { badgeMetaForStatus } from "@/lib";

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

function SectionIcon({ kind }: { kind: "trend" | "table" | "ai" | "actions" }) {
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

  return (
    <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </svg>
  );
}

export default function DashboardPage() {
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
              defaultValue="30d"
              id="date-range"
              name="date-range"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="ytd">Year to date</option>
            </select>
          </div>
        }
      />

      <section
        aria-label="KPI cards"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
      >
        {dashboardKpis.map((kpi, index) => {
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
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Interaction Volume Trend</h2>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">Last 30 days</span>
            </header>
            <div
              aria-label="Line chart showing interaction volume over time"
              className="relative h-80 overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4"
            >
              {/* Grid lines */}
              <div className="absolute inset-x-4 top-1/4 border-t border-gray-200" />
              <div className="absolute inset-x-4 top-2/4 border-t border-gray-200" />
              <div className="absolute inset-x-4 top-3/4 border-t border-gray-200" />
              <div className="absolute left-1/4 inset-y-4 border-l border-gray-200" />
              <div className="absolute left-2/4 inset-y-4 border-l border-gray-200" />
              <div className="absolute left-3/4 inset-y-4 border-l border-gray-200" />

              {/* Chart */}
              <svg
                aria-hidden="true"
                className="absolute inset-4 h-full w-full"
                viewBox="0 0 100 100"
              >
                <polyline
                  fill="none"
                  points="0,80 10,75 20,60 30,65 40,45 50,50 60,35 70,40 80,25 90,30 100,20"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-sky-700"
                />
                {/* Data points */}
                <circle cx="0" cy="80" r="2" className="fill-sky-700" />
                <circle cx="20" cy="60" r="2" className="fill-sky-700" />
                <circle cx="40" cy="45" r="2" className="fill-sky-700" />
                <circle cx="60" cy="35" r="2" className="fill-sky-700" />
                <circle cx="80" cy="25" r="2" className="fill-sky-700" />
                <circle cx="100" cy="20" r="2" className="fill-sky-700" />
              </svg>

              {/* Axis labels */}
              <div className="absolute bottom-0 left-4 text-xs text-gray-500">Mar 1</div>
              <div className="absolute bottom-0 right-4 text-xs text-gray-500">Mar 30</div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-500 transform">
                Volume
              </div>
            </div>
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
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Recent Interactions</h2>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">Updated now</span>
            </header>
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
              rows={dashboardInteractions.map((row) => ({
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
              }))}
            />
          </Card>
        </div>

        <Card className="border-gray-200 bg-white shadow-sm">
          <header className="mb-6">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="rounded-full bg-violet-100 p-2 text-violet-700">
                <SectionIcon kind="ai" />
              </span>
              AI Guidance
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">AI Recommendations</h2>
            <p className="mt-2 text-sm text-gray-600">
              Data-driven insights to optimize your operations
            </p>
          </header>
          <ul className="space-y-4">
            {dashboardAiRecommendations.map((rec) => (
              <li key={rec.id} className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{rec.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{rec.description}</p>
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
              </li>
            ))}
          </ul>
        </Card>
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
          <button className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 text-center transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">Create Workflow</span>
          </button>
          <button className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 text-center transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">View Reports</span>
          </button>
          <button className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 text-center transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">Configure Integrations</span>
          </button>
          <button className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 text-center transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">Start Chat Support</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
