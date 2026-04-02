import { buildSupportMetricsPayload } from "@/lib/support-records/metrics";
import type { InsightItem, StoredSupportRecord, SupportRecordCategory } from "@/types";

const categoryInsightConfig: Record<
  SupportRecordCategory,
  Pick<InsightItem, "category" | "title" | "recommendation" | "estimatedTimeSaved">
> = {
  Delivery: {
    category: "Knowledge",
    title: "Delivery issues dominate the current support volume",
    recommendation:
      "Expand delivery-status guidance, prebuild shipping macros, and consider proactive ETA messaging for delayed orders.",
    estimatedTimeSaved: "3.1 hrs/week",
  },
  Returns: {
    category: "Knowledge",
    title: "Returns questions are consuming too much of the support queue",
    recommendation:
      "Clarify return windows, automate label delivery, and add stronger self-service guidance for refund timing and exceptions.",
    estimatedTimeSaved: "2.8 hrs/week",
  },
  Billing: {
    category: "Operations",
    title: "Billing questions are driving a disproportionate share of support demand",
    recommendation:
      "Review the most common invoice and payment issues, tighten billing macros, and create earlier escalation rules for refund-risk conversations.",
    estimatedTimeSaved: "3.6 hrs/week",
  },
  Account: {
    category: "Support",
    title: "Account-related requests are surfacing enough volume to justify tighter routing",
    recommendation:
      "Add earlier handoff rules for access issues, tighten account-recovery guidance, and prepare approved responses for common verification cases.",
    estimatedTimeSaved: "2.5 hrs/week",
  },
};

function buildCategoryDemandInsight(category: SupportRecordCategory, share: number): InsightItem {
  const config = categoryInsightConfig[category];

  return {
    id: `${category.toLowerCase()}-demand`,
    title: config.title,
    category: config.category,
    supportCategory: category,
    priority: share >= 45 ? "high" : "medium",
    confidence: 0.86,
    recommendation: config.recommendation,
    reason: `${category} conversations account for ${share.toFixed(0)}% of the imported support records.`,
    estimatedTimeSaved: config.estimatedTimeSaved,
    automationOpportunity: true,
    status: "new",
    decision: "pending",
  };
}

export function buildSupportInsights(records: StoredSupportRecord[]): InsightItem[] {
  if (records.length === 0) return [];

  const overall = buildSupportMetricsPayload({
    records,
    timeframe: "30d",
    channel: "all",
    category: "all",
  });

  const items: InsightItem[] = [];

  if (overall.summary.escalationRate >= 18) {
    items.push({
      id: "escalation-rate",
      title: "Escalation rate is too high for the current support load",
      category: "Support",
      supportCategory: "all",
      priority: "high",
      confidence: 0.93,
      recommendation:
        "Review the highest-friction categories first, tighten routing rules, and add earlier handoff logic for conversations that stall.",
      reason: `${overall.summary.escalationRate.toFixed(0)}% of imported conversations were escalated in the last 30 days.`,
      estimatedTimeSaved: "5.5 hrs/week",
      automationOpportunity: true,
      status: "new",
      decision: "pending",
    });
  }

  if (overall.summary.avgResponseMinutes >= 12) {
    items.push({
      id: "response-latency",
      title: "Average response time is trending above the desired threshold",
      category: "Operations",
      supportCategory: "all",
      priority: overall.summary.avgResponseMinutes >= 18 ? "high" : "medium",
      confidence: 0.89,
      recommendation:
        "Prioritize the slowest channels, review staffing windows, and promote repeat answers into approved response shortcuts.",
      reason: `Imported records show an average response time of ${overall.summary.avgResponseMinutes.toFixed(1)} minutes.`,
      estimatedTimeSaved: "3.8 hrs/week",
      automationOpportunity: true,
      status: "new",
      decision: "pending",
    });
  }

  if (overall.summary.resolutionRate < 70) {
    items.push({
      id: "resolution-gap",
      title: "Resolution rate suggests support workflows need refinement",
      category: "Automation",
      supportCategory: "all",
      priority: "high",
      confidence: 0.91,
      recommendation:
        "Audit unresolved conversations, identify repeat failure patterns, and convert the top issues into guided support flows.",
      reason: `Only ${overall.summary.resolutionRate.toFixed(0)}% of imported conversations are marked resolved.`,
      estimatedTimeSaved: "4.6 hrs/week",
      automationOpportunity: true,
      status: "new",
      decision: "pending",
    });
  }

  (Object.keys(categoryInsightConfig) as SupportRecordCategory[]).forEach((supportCategory) => {
    const categoryMetrics = buildSupportMetricsPayload({
      records,
      timeframe: "30d",
      channel: "all",
      category: supportCategory,
    });

    if (categoryMetrics.summary.totalConversations === 0) return;

    const categoryShare =
      (categoryMetrics.summary.totalConversations / Math.max(overall.summary.totalConversations, 1)) * 100;

    if (categoryShare >= 35) {
      items.push(buildCategoryDemandInsight(supportCategory, categoryShare));
    }
  });

  if (overall.summary.highPriorityOpenConversations >= 5) {
    items.push({
      id: "priority-backlog",
      title: "High-priority open conversations need closer queue management",
      category: "Operations",
      supportCategory: "all",
      priority: "medium",
      confidence: 0.84,
      recommendation:
        "Review high-priority open records first, assign explicit owners, and create escalation SLAs for unresolved cases.",
      reason: `${overall.summary.highPriorityOpenConversations} high-priority conversations remain open in the current support window.`,
      estimatedTimeSaved: "2.4 hrs/week",
      automationOpportunity: false,
      status: "new",
      decision: "pending",
    });
  }

  if (items.length > 0) {
    return items;
  }

  return [
    {
      id: "stable-support-health",
      title: "Imported support records look stable overall",
      category: "Support",
      supportCategory: "all",
      priority: "low",
      confidence: 0.78,
      recommendation:
        "Keep capturing support records, monitor category mix weekly, and expand automation only where repeat demand is increasing.",
      reason:
        "Current imported records do not cross the alert thresholds for escalation rate, resolution rate, or response time.",
      estimatedTimeSaved: "1.5 hrs/week",
      automationOpportunity: false,
      status: "new",
      decision: "pending",
    },
  ];
}
