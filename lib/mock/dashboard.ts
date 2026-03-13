import type { DashboardInteraction, DashboardKpi } from "@/types";

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
  {
    id: "INT-1035",
    customer: "Canyon Logistics",
    channel: "Phone",
    issue: "Return authorization",
    status: "Open",
    updated: isoMinutesAgo(120),
  },
];
