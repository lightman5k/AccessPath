import type { DateRange, ModuleFilter, ReportRecord } from "@/types";

export const dateRangeOptions: Array<{ value: DateRange; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export const moduleOptions: Array<{ value: ModuleFilter; label: string }> = [
  { value: "all", label: "All modules" },
  { value: "Workflow Builder", label: "Workflow Builder" },
  { value: "Customer Service", label: "Customer Service" },
  { value: "Integrations", label: "Integrations" },
];

export const reportData: ReportRecord[] = [
  {
    id: "rpt-1001",
    name: "Support Intake Performance",
    module: "Customer Service",
    createdAt: "2026-03-07T14:20:00.000Z",
    totalEvents: 1240,
    completionRate: 91,
    errors: 14,
  },
  {
    id: "rpt-1002",
    name: "Order Workflow Throughput",
    module: "Workflow Builder",
    createdAt: "2026-03-05T09:15:00.000Z",
    totalEvents: 980,
    completionRate: 87,
    errors: 19,
  },
  {
    id: "rpt-1003",
    name: "Connector Health Weekly",
    module: "Integrations",
    createdAt: "2026-03-02T18:10:00.000Z",
    totalEvents: 650,
    completionRate: 95,
    errors: 6,
  },
  {
    id: "rpt-1004",
    name: "Escalation Aging Audit",
    module: "Customer Service",
    createdAt: "2026-02-25T11:40:00.000Z",
    totalEvents: 890,
    completionRate: 82,
    errors: 31,
  },
  {
    id: "rpt-1005",
    name: "Automation Success Snapshot",
    module: "Workflow Builder",
    createdAt: "2026-02-18T16:05:00.000Z",
    totalEvents: 1110,
    completionRate: 89,
    errors: 22,
  },
  {
    id: "rpt-1006",
    name: "Drive Export Reliability",
    module: "Integrations",
    createdAt: "2026-01-26T08:30:00.000Z",
    totalEvents: 430,
    completionRate: 93,
    errors: 9,
  },
  {
    id: "rpt-1007",
    name: "Resolution Time Trend",
    module: "Customer Service",
    createdAt: "2026-01-10T13:25:00.000Z",
    totalEvents: 770,
    completionRate: 85,
    errors: 27,
  },
];
