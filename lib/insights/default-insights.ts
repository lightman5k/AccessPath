import type { InsightItem } from "@/types";

export const defaultInsightItems: InsightItem[] = [
  {
    id: "delay-cluster",
    title: "Shipping delay conversations should trigger a proactive recovery workflow",
    category: "Support",
    supportCategory: "Delivery",
    priority: "high",
    confidence: 0.94,
    recommendation:
      "Update the assistant to acknowledge delay frustration earlier, provide ETA context in the first response, and route refund-risk conversations after the second negative reply.",
    reason:
      "The model detected a rise in delay-related dissatisfaction, repeat order-status contacts, and refund intent after extended back-and-forth exchanges.",
    estimatedTimeSaved: "6.5 hrs/week",
    automationOpportunity: true,
    status: "ready",
    decision: "pending",
  },
  {
    id: "refund-faq-gap",
    title: "Expand refund timeline guidance in the knowledge base",
    category: "Knowledge",
    supportCategory: "Returns",
    priority: "medium",
    confidence: 0.88,
    recommendation:
      "Add FAQ coverage for refund timing after item receipt and clarify exception cases for expedited shipping and damaged goods.",
    reason:
      "The assistant is resolving policy eligibility correctly but confidence drops when customers ask about processing times and reimbursement timing.",
    estimatedTimeSaved: "3.2 hrs/week",
    automationOpportunity: true,
    status: "new",
    decision: "pending",
  },
  {
    id: "sync-health",
    title: "Escalate stale order data when integration sync health degrades",
    category: "Operations",
    supportCategory: "Delivery",
    priority: "high",
    confidence: 0.91,
    recommendation:
      "Add a safeguard that suppresses delivery promises and flags the conversation for human review when the storefront sync falls behind expected refresh intervals.",
    reason:
      "A recent sync lag is causing delivery updates to age out, increasing the risk of inaccurate order-status responses and repeat contacts.",
    estimatedTimeSaved: "4.8 hrs/week",
    automationOpportunity: false,
    status: "in-review",
    decision: "pending",
  },
  {
    id: "account-security-routing",
    title: "Route account and security requests to humans earlier",
    category: "Support",
    supportCategory: "Account",
    priority: "medium",
    confidence: 0.82,
    recommendation:
      "Add a rule that triggers handoff when customers mention password resets, unauthorized access, or profile ownership disputes.",
    reason:
      "These conversations show lower resolution confidence and carry higher risk if fully handled by automation.",
    estimatedTimeSaved: "2.1 hrs/week",
    automationOpportunity: false,
    status: "ready",
    decision: "pending",
  },
  {
    id: "macro-replies",
    title: "Promote repeated approved responses into reusable automations",
    category: "Automation",
    supportCategory: "all",
    priority: "low",
    confidence: 0.79,
    recommendation:
      "Convert the most repeated agent-authored shipping and returns replies into assistant-ready response patterns with approval checkpoints.",
    reason:
      "Agents are manually repeating the same approved responses across common scenarios, indicating low-risk automation potential.",
    estimatedTimeSaved: "5.4 hrs/week",
    automationOpportunity: true,
    status: "new",
    decision: "pending",
  },
];


