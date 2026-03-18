"use client";

import { useMemo, useState } from "react";
import { Badge, Card, PageHeader } from "@/components/ui";

type InsightPriority = "high" | "medium" | "low";
type InsightCategory = "Support" | "Operations" | "Automation" | "Knowledge";

type InsightItem = {
  id: string;
  title: string;
  category: InsightCategory;
  priority: InsightPriority;
  confidence: number;
  recommendation: string;
  reason: string;
  estimatedTimeSaved: string;
  automationOpportunity: boolean;
  status: "new" | "in-review" | "ready";
};

const insightItems: InsightItem[] = [
  {
    id: "delay-cluster",
    title: "Shipping delay conversations should trigger a proactive recovery workflow",
    category: "Support",
    priority: "high",
    confidence: 0.94,
    recommendation:
      "Update the assistant to acknowledge delay frustration earlier, provide ETA context in the first response, and route refund-risk conversations after the second negative reply.",
    reason:
      "The model detected a rise in delay-related dissatisfaction, repeat order-status contacts, and refund intent after extended back-and-forth exchanges.",
    estimatedTimeSaved: "6.5 hrs/week",
    automationOpportunity: true,
    status: "ready",
  },
  {
    id: "refund-faq-gap",
    title: "Expand refund timeline guidance in the knowledge base",
    category: "Knowledge",
    priority: "medium",
    confidence: 0.88,
    recommendation:
      "Add FAQ coverage for refund timing after item receipt and clarify exception cases for expedited shipping and damaged goods.",
    reason:
      "The assistant is resolving policy eligibility correctly but confidence drops when customers ask about processing times and reimbursement timing.",
    estimatedTimeSaved: "3.2 hrs/week",
    automationOpportunity: true,
    status: "new",
  },
  {
    id: "sync-health",
    title: "Escalate stale order data when integration sync health degrades",
    category: "Operations",
    priority: "high",
    confidence: 0.91,
    recommendation:
      "Add a safeguard that suppresses delivery promises and flags the conversation for human review when the storefront sync falls behind expected refresh intervals.",
    reason:
      "A recent sync lag is causing delivery updates to age out, increasing the risk of inaccurate order-status responses and repeat contacts.",
    estimatedTimeSaved: "4.8 hrs/week",
    automationOpportunity: false,
    status: "in-review",
  },
  {
    id: "account-security-routing",
    title: "Route account and security requests to humans earlier",
    category: "Support",
    priority: "medium",
    confidence: 0.82,
    recommendation:
      "Add a rule that triggers handoff when customers mention password resets, unauthorized access, or profile ownership disputes.",
    reason:
      "These conversations show lower resolution confidence and carry higher risk if fully handled by automation.",
    estimatedTimeSaved: "2.1 hrs/week",
    automationOpportunity: false,
    status: "ready",
  },
  {
    id: "macro-replies",
    title: "Promote repeated approved responses into reusable automations",
    category: "Automation",
    priority: "low",
    confidence: 0.79,
    recommendation:
      "Convert the most repeated agent-authored shipping and returns replies into assistant-ready response patterns with approval checkpoints.",
    reason:
      "Agents are manually repeating the same approved responses across common scenarios, indicating low-risk automation potential.",
    estimatedTimeSaved: "5.4 hrs/week",
    automationOpportunity: true,
    status: "new",
  },
];

const priorityOptions = ["all", "high", "medium", "low"] as const;
const categoryOptions = ["all", "Support", "Operations", "Automation", "Knowledge"] as const;
const confidenceOptions = ["all", "80", "90"] as const;

function badgeVariantForPriority(priority: InsightPriority) {
  if (priority === "high") return "danger";
  if (priority === "medium") return "warning";
  return "info";
}

function badgeVariantForStatus(status: InsightItem["status"]) {
  if (status === "ready") return "success";
  if (status === "in-review") return "warning";
  return "neutral";
}

function SectionIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M4 16 9 11l3 3 8-8" />
      <path d="M15 6h5v5" />
    </svg>
  );
}

export default function InsightsPage() {
  const [priorityFilter, setPriorityFilter] = useState<(typeof priorityOptions)[number]>("all");
  const [categoryFilter, setCategoryFilter] = useState<(typeof categoryOptions)[number]>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<(typeof confidenceOptions)[number]>("all");
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const filteredInsights = useMemo(() => {
    return insightItems.filter((item) => {
      if (dismissedIds.includes(item.id)) return false;
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (confidenceFilter !== "all" && item.confidence < Number(confidenceFilter) / 100) return false;
      return true;
    });
  }, [categoryFilter, confidenceFilter, dismissedIds, priorityFilter]);

  const summaryCards = useMemo(() => {
    const activeInsights = filteredInsights.length;
    const highPriorityItems = filteredInsights.filter((item) => item.priority === "high").length;
    const automationOpportunities = filteredInsights.filter((item) => item.automationOpportunity).length;

    const estimatedHours = filteredInsights.reduce((total, item) => {
      const numeric = Number(item.estimatedTimeSaved.replace(" hrs/week", ""));
      return Number.isNaN(numeric) ? total : total + numeric;
    }, 0);

    return [
      {
        label: "Active insights",
        value: String(activeInsights),
        helperText: "Currently visible recommendations after filters.",
        accentClass: "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
      },
      {
        label: "High-priority items",
        value: String(highPriorityItems),
        helperText: "Recommendations that need same-day review.",
        accentClass: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
      },
      {
        label: "Estimated time saved",
        value: `${estimatedHours.toFixed(1)} hrs/week`,
        helperText: "Projected impact if suggested changes are adopted.",
        accentClass: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
      },
      {
        label: "Automation opportunities",
        value: String(automationOpportunities),
        helperText: "Insights that can likely be converted into automated workflows.",
        accentClass: "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
      },
    ];
  }, [filteredInsights]);

  const dismissInsight = (id: string) => {
    setDismissedIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AccessPath AI Insights"
        description="Review model-generated recommendations, prioritize operational improvements, and decide which actions to apply in the MVP demo."
        actions={<Badge variant="info" className="px-3 py-1">Mock recommendation engine</Badge>}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`relative overflow-hidden border ${card.accentClass} p-0 shadow-sm`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-400" />
            <div className="p-5">
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">{card.helperText}</p>
            </div>
          </Card>
        ))}
      </section>

      <Card className="border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="rounded-full bg-violet-100 p-2 text-violet-700">
                <SectionIcon />
              </span>
              Intelligence
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Insight Queue</h2>
            <p className="mt-2 text-sm text-gray-600">
              Filter AI-generated recommendations by urgency, domain, and confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="text-sm text-gray-600" htmlFor="insights-priority-filter">
                Priority
              </label>
              <select
                id="insights-priority-filter"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onChange={(event) =>
                  setPriorityFilter(event.target.value as (typeof priorityOptions)[number])
                }
                value={priorityFilter}
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600" htmlFor="insights-category-filter">
                Category
              </label>
              <select
                id="insights-category-filter"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onChange={(event) =>
                  setCategoryFilter(event.target.value as (typeof categoryOptions)[number])
                }
                value={categoryFilter}
              >
                <option value="all">All categories</option>
                <option value="Support">Support</option>
                <option value="Operations">Operations</option>
                <option value="Automation">Automation</option>
                <option value="Knowledge">Knowledge</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600" htmlFor="insights-confidence-filter">
                Confidence
              </label>
              <select
                id="insights-confidence-filter"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onChange={(event) =>
                  setConfidenceFilter(event.target.value as (typeof confidenceOptions)[number])
                }
                value={confidenceFilter}
              >
                <option value="all">All scores</option>
                <option value="90">90% and above</option>
                <option value="80">80% and above</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        {filteredInsights.length > 0 ? (
          filteredInsights.map((item) => (
            <Card key={item.id} className="border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">{item.category}</Badge>
                    <Badge variant={badgeVariantForPriority(item.priority)}>
                      {item.priority === "high"
                        ? "High priority"
                        : item.priority === "medium"
                          ? "Medium priority"
                          : "Low priority"}
                    </Badge>
                    <Badge variant={badgeVariantForStatus(item.status)}>
                      {item.status === "ready"
                        ? "Ready"
                        : item.status === "in-review"
                          ? "In review"
                          : "New"}
                    </Badge>
                  </div>

                  <h2 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h2>

                  <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-gray-600 xl:grid-cols-[120px_1fr]">
                    <div className="font-medium text-gray-500">Confidence</div>
                    <div>{(item.confidence * 100).toFixed(0)}%</div>

                    <div className="font-medium text-gray-500">Recommendation</div>
                    <div className="leading-6 text-gray-700">{item.recommendation}</div>

                    <div className="font-medium text-gray-500">Why this appeared</div>
                    <div className="leading-6 text-gray-700">{item.reason}</div>

                    <div className="font-medium text-gray-500">Estimated impact</div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-gray-700">{item.estimatedTimeSaved}</span>
                      {item.automationOpportunity ? (
                        <Badge variant="success">Automation opportunity</Badge>
                      ) : (
                        <Badge variant="neutral">Manual review advised</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full xl:w-56">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Actions
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                        type="button"
                      >
                        Review
                      </button>
                      <button
                        className="rounded-md border border-gray-900 bg-gray-900 px-3 py-2 text-sm text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                        type="button"
                      >
                        Apply
                      </button>
                      <button
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                        onClick={() => dismissInsight(item.id)}
                        type="button"
                      >
                        Dismiss
                      </button>
                      <button
                        className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2"
                        type="button"
                      >
                        Escalate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center">
              <p className="text-sm font-medium text-gray-700">No insights match the current filters</p>
              <p className="mt-1 text-sm text-gray-500">
                Broaden priority, category, or confidence settings to view more recommendations.
              </p>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
