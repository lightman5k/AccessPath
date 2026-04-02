"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, PageHeader, Skeleton, Toast } from "@/components/ui";
import type {
  InsightAction,
  InsightDecision,
  InsightItem,
  InsightPriority,
  InsightsApiResponse,
  InsightsErrorResponse,
  SupportRecordCategory,
  UpdateInsightRequest,
} from "@/types";

const priorityOptions = ["all", "high", "medium", "low"] as const;
const categoryOptions = ["all", "Support", "Operations", "Automation", "Knowledge"] as const;
const confidenceOptions = ["all", "80", "90"] as const;
const supportCategoryOptions = ["Delivery", "Returns", "Billing", "Account"] as const;

function sanitizeSupportCategory(value: string | null): SupportRecordCategory | "all" {
  if ((supportCategoryOptions as readonly string[]).includes(value ?? "")) {
    return value as SupportRecordCategory;
  }

  return "all";
}

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

function badgeVariantForDecision(decision: InsightDecision) {
  if (decision === "applied") return "success";
  if (decision === "escalated") return "warning";
  if (decision === "dismissed") return "neutral";
  return "info";
}

function decisionLabel(decision: InsightDecision) {
  if (decision === "applied") return "Applied";
  if (decision === "escalated") return "Escalated";
  if (decision === "dismissed") return "Dismissed";
  return "Pending";
}

function actionSuccessMessage(action: InsightAction) {
  if (action === "review") return "Insight moved into review.";
  if (action === "apply") return "Insight marked as applied.";
  if (action === "dismiss") return "Insight dismissed.";
  return "Insight escalated for follow-up.";
}

function formatDecisionTime(value?: string) {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
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

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AccessPath AI Insights"
        description="Review model-generated recommendations, prioritize operational improvements, and decide which actions to apply in the MVP demo."
        actions={<Badge variant="info" className="px-3 py-1">Loading insights</Badge>}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`insights-summary-${index}`} className="p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-3 h-4 w-36" />
          </Card>
        ))}
      </section>

      <Card className="border-gray-200 bg-white shadow-sm">
        <Skeleton className="h-6 w-40" />
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`insights-filter-${index}`} className="h-10 w-full" />
          ))}
        </div>
      </Card>

      <section className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`insights-item-${index}`} className="border-gray-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-6 h-20 w-full" />
          </Card>
        ))}
      </section>
    </div>
  );
}

export default function InsightsPage() {
  const searchParams = useSearchParams();
  const supportCategoryFilter = sanitizeSupportCategory(searchParams.get("supportCategory"));
  const [priorityFilter, setPriorityFilter] = useState<(typeof priorityOptions)[number]>("all");
  const [categoryFilter, setCategoryFilter] = useState<(typeof categoryOptions)[number]>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<(typeof confidenceOptions)[number]>("all");
  const [insightsData, setInsightsData] = useState<InsightsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [submittingById, setSubmittingById] = useState<Record<string, InsightAction | undefined>>({});
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [highlightedInsightId, setHighlightedInsightId] = useState<string | null>(null);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInsights() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/insights", {
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = (await response.json()) as InsightsApiResponse | InsightsErrorResponse;
        if (!response.ok || !("items" in payload)) {
          const message =
            "error" in payload ? payload.error : `Insights request failed with status ${response.status}.`;
          throw new Error(message);
        }

        setInsightsData(payload);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load insights data.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadInsights();

    return () => controller.abort();
  }, [retryKey]);

  const filteredInsights = useMemo(() => {
    const items = insightsData?.items ?? [];

    return items.filter((item) => {
      if (item.decision === "dismissed") return false;
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (confidenceFilter !== "all" && item.confidence < Number(confidenceFilter) / 100) return false;
      if (supportCategoryFilter !== "all") {
        const scopedSupportCategory = item.supportCategory ?? "all";
        if (scopedSupportCategory !== "all" && scopedSupportCategory !== supportCategoryFilter) return false;
      }
      return true;
    });
  }, [categoryFilter, confidenceFilter, insightsData, priorityFilter, supportCategoryFilter]);

  useEffect(() => {
    const focusedInsightId = searchParams.get("focus");
    if (!focusedInsightId) return;

    const match = filteredInsights.find((item) => item.id === focusedInsightId);
    if (!match) return;

    setHighlightedInsightId(focusedInsightId);

    const timeout = window.setTimeout(() => {
      const element = document.getElementById(`insight-card-${focusedInsightId}`);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
      element?.focus();
    }, 80);

    const clearTimeoutId = window.setTimeout(() => {
      setHighlightedInsightId((current) => (current === focusedInsightId ? null : current));
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(clearTimeoutId);
    };
  }, [filteredInsights, searchParams]);

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

  const handleInsightAction = async (insightId: string, action: InsightAction) => {
    setSubmittingById((current) => ({ ...current, [insightId]: action }));

    try {
      const payload: UpdateInsightRequest = { insightId, action };
      const response = await fetch("/api/insights", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as InsightsApiResponse | InsightsErrorResponse;
      if (!response.ok || !("items" in data)) {
        const message =
          "error" in data ? data.error : "Unable to update insight state.";
        throw new Error(message);
      }

      setInsightsData(data);
      setToastMessage(actionSuccessMessage(action));
      setToastOpen(true);
      setError(null);
    } catch (actionError) {
      setToastMessage(
        actionError instanceof Error ? actionError.message : "Unable to update insight state.",
      );
      setToastOpen(true);
    } finally {
      setSubmittingById((current) => ({ ...current, [insightId]: undefined }));
    }
  };

  if (!insightsData && loading) {
    return <InsightsSkeleton />;
  }

  if (!insightsData && error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AccessPath AI Insights"
          description="Review model-generated recommendations, prioritize operational improvements, and decide which actions to apply in the MVP demo."
        />
        <Card className="border-gray-200 bg-white shadow-sm">
          <EmptyState
            title="Insights could not be loaded"
            description={error}
            className="py-12"
          />
          <div className="mt-4 flex justify-center">
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => {
                setLoading(true);
                setError(null);
                setRetryKey((current) => current + 1);
              }}
              type="button"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!insightsData) return null;

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <PageHeader
        title="AccessPath AI Insights"
        description="Review model-generated recommendations, prioritize operational improvements, and decide which actions to apply in the MVP demo."
        actions={<Badge variant="info" className="px-3 py-1">Persistent insights feed</Badge>}
      />

      {error ? (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <p className="text-sm font-medium text-amber-900">Insights refresh failed</p>
          <p className="mt-1 text-sm text-amber-800">{error}</p>
        </Card>
      ) : null}

      {supportCategoryFilter !== "all" ? (
        <Card className="border-sky-200 bg-sky-50/70 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-medium text-sky-900">Focused on {supportCategoryFilter}-related insights</p>
              <p className="mt-1 text-sm leading-6 text-sky-800">
                Showing insights tagged to {supportCategoryFilter} plus cross-cutting recommendations that apply across the support queue.
              </p>
            </div>
            <Link
              className="rounded-md border border-sky-300 bg-white px-3 py-2 text-sm text-sky-800 transition hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2"
              href="/insights"
            >
              Clear Focus
            </Link>
          </div>
        </Card>
      ) : null}

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
          filteredInsights.map((item) => {
            const isSubmitting = Boolean(submittingById[item.id]);
            const decisionTimestamp = formatDecisionTime(item.decisionUpdatedAt);
            const isHighlighted = highlightedInsightId === item.id;

            return (
              <Card
                key={item.id}
                className={`border-gray-200 bg-white p-5 shadow-sm transition ${
                  isHighlighted ? "ring-2 ring-sky-400 ring-offset-2" : ""
                }`}
                id={`insight-card-${item.id}`}
                tabIndex={-1}
              >
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
                      {item.decision !== "pending" ? (
                        <Badge variant={badgeVariantForDecision(item.decision)}>
                          {decisionLabel(item.decision)}
                        </Badge>
                      ) : null}
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
                      {decisionTimestamp ? (
                        <p className="mt-2 text-xs text-gray-500">Last updated {decisionTimestamp}</p>
                      ) : null}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isSubmitting || (item.status === "in-review" && item.decision === "pending")}
                          onClick={() => handleInsightAction(item.id, "review")}
                          type="button"
                        >
                          {submittingById[item.id] === "review"
                            ? "Saving..."
                            : item.status === "in-review" && item.decision === "pending"
                              ? "In review"
                              : "Review"}
                        </button>
                        <button
                          className="rounded-md border border-gray-900 bg-gray-900 px-3 py-2 text-sm text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isSubmitting || item.decision === "applied"}
                          onClick={() => handleInsightAction(item.id, "apply")}
                          type="button"
                        >
                          {submittingById[item.id] === "apply"
                            ? "Saving..."
                            : item.decision === "applied"
                              ? "Applied"
                              : "Apply"}
                        </button>
                        <button
                          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isSubmitting}
                          onClick={() => handleInsightAction(item.id, "dismiss")}
                          type="button"
                        >
                          {submittingById[item.id] === "dismiss" ? "Saving..." : "Dismiss"}
                        </button>
                        <button
                          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isSubmitting || item.decision === "escalated"}
                          onClick={() => handleInsightAction(item.id, "escalate")}
                          type="button"
                        >
                          {submittingById[item.id] === "escalate"
                            ? "Saving..."
                            : item.decision === "escalated"
                              ? "Escalated"
                              : "Escalate"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
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


