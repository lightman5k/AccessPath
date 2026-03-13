import { Card, PageHeader } from "@/components/ui";

const placeholderSections = [
  {
    title: "Bot Profile",
    description: "Placeholder area for assistant name, tone, welcome message, and default channel settings.",
  },
  {
    title: "Conversation Rules",
    description: "Placeholder area for intents, routing logic, fallback behavior, and escalation thresholds.",
  },
  {
    title: "Knowledge Sources",
    description: "Placeholder area for connected documents, FAQs, retrieval settings, and sync controls.",
  },
  {
    title: "Testing Panel",
    description: "Placeholder area for prompt simulation, response preview, and publish readiness checks.",
  },
];

export default function ChatbotConfigPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Chatbot Config"
        description="Configure assistant behavior, handoff rules, and knowledge inputs for the MVP demo."
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {placeholderSections.map((section) => (
          <Card key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{section.description}</p>
            <div className="mt-6 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-sm text-gray-500">
              Backend-ready placeholder section
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
