import { Card, PageHeader } from "@/components/ui";

const analyticsSections = [
  {
    title: "Performance Overview",
    description: "Placeholder area for KPI tiles, trend comparisons, and date-range driven summary metrics.",
  },
  {
    title: "Channel Breakdown",
    description: "Placeholder area for traffic, volume, and conversion metrics by source or support channel.",
  },
  {
    title: "Customer Trends",
    description: "Placeholder area for retention, resolution time, and account-level behavior analysis.",
  },
  {
    title: "Export Queue",
    description: "Placeholder area for scheduled exports, report history, and delivery status tracking.",
  },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track performance trends, channel metrics, and export-ready reporting from a single MVP view."
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {analyticsSections.map((section) => (
          <Card key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{section.description}</p>
            <div className="mt-6 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-sm text-gray-500">
              Placeholder analytics module
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
