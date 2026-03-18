import type { DashboardAiRecommendation, DashboardInteraction, DashboardKpi } from "@/types";

const baseUpdatedIso = "2026-03-08T15:00:00.000Z";
function isoMinutesAgo(minutesAgo: number): string {
  const base = new Date(baseUpdatedIso).getTime();
  return new Date(base - minutesAgo * 60_000).toISOString();
}

export const dashboardKpis: DashboardKpi[] = [
  {
    label: "Total Interactions",
    value: "12,840",
    change: "+8.2%",
    trend: "vs last 30 days",
  },
  {
    label: "Avg Resolution Time",
    value: "18m",
    change: "-5.6%",
    trend: "faster than prior period",
  },
  {
    label: "Active Workflows",
    value: "43",
    change: "+3",
    trend: "new this week",
  },
  {
    label: "CSAT Score",
    value: "94.1%",
    change: "+1.4%",
    trend: "week over week",
  },
];

export const dashboardInteractions: DashboardInteraction[] = [
  {
    id: "INT-1042",
    customer: "Northwind Traders",
    channel: "Email",
    issue: "Delivery status request",
    status: "Open",
    updated: isoMinutesAgo(5),
  },
  {
    id: "INT-1041",
    customer: "Acme Retail",
    channel: "Phone",
    issue: "Invoice mismatch",
    status: "In Progress",
    updated: isoMinutesAgo(12),
  },
  {
    id: "INT-1040",
    customer: "Blue Ridge Co.",
    channel: "Chat",
    issue: "Workflow trigger failed",
    status: "Resolved",
    updated: isoMinutesAgo(25),
  },
  {
    id: "INT-1039",
    customer: "Helios Health",
    channel: "Email",
    issue: "Inventory discrepancy",
    status: "Open",
    updated: isoMinutesAgo(31),
  },
  {
    id: "INT-1038",
    customer: "Metro Supplies",
    channel: "Phone",
    issue: "Damaged shipment",
    status: "Escalated",
    updated: isoMinutesAgo(44),
  },
  {
    id: "INT-1037",
    customer: "Summit Foods",
    channel: "Chat",
    issue: "API authentication",
    status: "In Progress",
    updated: isoMinutesAgo(60),
  },
  {
    id: "INT-1036",
    customer: "Orbit Parts",
    channel: "Email",
    issue: "Route optimization",
    status: "Resolved",
    updated: isoMinutesAgo(60),
  },
];

export const dashboardAiRecommendations: DashboardAiRecommendation[] = [
  {
    id: "rec-1",
    title: "Optimize Response Times",
    description: "Implement automated routing for high-priority issues to reduce average resolution time by 15%.",
    impact: "High",
    category: "Efficiency",
  },
  {
    id: "rec-2",
    title: "Proactive Escalation Alerts",
    description: "Set up alerts for interactions exceeding 2-hour SLA thresholds to prevent escalations.",
    impact: "Medium",
    category: "Quality",
  },
  {
    id: "rec-3",
    title: "Channel Optimization",
    description: "Redirect 20% of email inquiries to self-service chatbots to free up agent capacity.",
    impact: "High",
    category: "Automation",
  },
  {
    id: "rec-4",
    title: "Workflow Enhancement",
    description: "Add conditional logic to logistics workflows for automatic shipment status updates.",
    impact: "Medium",
    category: "Integration",
  },
];
