import { Card, PageHeader } from "@/components/ui";

const insightSections = [
  {
    title: "AI Summary",
    description: "Placeholder summary for the most important trends, risks, and recommended next actions.",
  },
  {
    title: "Support Signals",
    description: "Placeholder section for sentiment shifts, escalation patterns, and unresolved issue clusters.",
  },
  {
    title: "Operational Signals",
    description: "Placeholder section for anomalies across fulfillment, inventory pressure, and integration health.",
  },
  {
    title: "Recommended Actions",
    description: "Placeholder section for prioritized actions generated from current system conditions.",
  },
];

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        description="Review AI-generated takeaways, emerging issues, and recommended actions across the platform."
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {insightSections.map((section) => (
          <Card key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{section.description}</p>
            <div className="mt-6 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-sm text-gray-500">
              Placeholder content ready for real insight payloads
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
