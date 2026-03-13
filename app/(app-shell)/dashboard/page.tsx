import { dashboardInteractions, dashboardKpis } from "@/lib/mock";
import { Badge, EmptyState } from "@/components/ui";
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

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor operations, support activity, and performance trends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600" htmlFor="date-range">
            Date Range
          </label>
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
      </section>

      <section
        aria-label="KPI cards"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {dashboardKpis.map((kpi) => (
          <article
            className="rounded-lg border border-gray-200 bg-white p-4"
            key={kpi.label}
          >
            <p className="text-sm text-gray-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold">{kpi.value}</p>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{kpi.change}</span>{" "}
              {kpi.trend}
            </p>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Interaction Volume</h2>
              <span className="text-sm text-gray-500">Mock trend data</span>
            </header>
            <div
              aria-label="Line chart placeholder"
              className="relative h-64 overflow-hidden rounded-md border border-dashed border-gray-300 bg-gradient-to-b from-gray-100 to-white"
            >
              <div className="absolute inset-x-0 top-1/4 border-t border-gray-200" />
              <div className="absolute inset-x-0 top-2/4 border-t border-gray-200" />
              <div className="absolute inset-x-0 top-3/4 border-t border-gray-200" />
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 40"
              >
                <polyline
                  fill="none"
                  points="0,30 12,28 24,18 36,22 48,14 60,16 72,10 84,13 100,8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-gray-700"
                />
              </svg>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Interactions</h2>
              <span className="text-sm text-gray-500">Last updated just now</span>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200 px-3 py-2 font-medium text-gray-600">
                      ID
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 font-medium text-gray-600">
                      Customer
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 font-medium text-gray-600">
                      Channel
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 font-medium text-gray-600">
                      Issue
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 font-medium text-gray-600">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardInteractions.length > 0 ? (
                    dashboardInteractions.map((row) => (
                      <tr className="hover:bg-gray-50" key={row.id}>
                        <td className="border-b border-gray-100 px-3 py-2 text-gray-800">
                          {row.id}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2 text-gray-800">
                          {row.customer}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2 text-gray-600">
                          {row.channel}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2 text-gray-600">
                          {row.issue}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2">
                          <Badge variant={badgeMetaForStatus(row.status).variant}>
                            {badgeMetaForStatus(row.status).label}
                          </Badge>
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2 text-gray-500">
                          {formatIsoAsAgo(row.updated)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="border-b border-gray-100 px-3 py-3" colSpan={6}>
                        <EmptyState
                          description="Try adjusting your data source or filters."
                          title="No interactions found"
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Insights</h2>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            <li className="rounded-md bg-gray-50 p-3">
              Response time improved by 5.6% after workflow updates.
            </li>
            <li className="rounded-md bg-gray-50 p-3">
              3 escalations today are all tied to delayed regional shipments.
            </li>
            <li className="rounded-md bg-gray-50 p-3">
              Email remains the top support channel at 42% of interactions.
            </li>
            <li className="rounded-md bg-gray-50 p-3">
              CSAT stays above 94%, highest among enterprise accounts.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
