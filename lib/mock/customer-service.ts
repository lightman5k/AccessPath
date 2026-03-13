import type {
  ConversationDetail,
  ConversationListItem,
  CustomerServiceKpi,
  QueueItem,
} from "@/types";

const baseUpdatedIso = "2026-03-08T15:00:00.000Z";
function isoMinutesAgo(minutesAgo: number): string {
  const base = new Date(baseUpdatedIso).getTime();
  return new Date(base - minutesAgo * 60_000).toISOString();
}

export const customerServiceKpis: CustomerServiceKpi[] = [
  {
    label: "Resolution Rate",
    value: "91.8%",
    note: "+2.3% vs last week",
  },
  {
    label: "Avg Response Time",
    value: "12m",
    note: "-1.8m vs last week",
  },
];

export const customerServiceQueueItems: QueueItem[] = [
  { priority: "High", count: 7, eta: "< 10 min" },
  { priority: "Medium", count: 18, eta: "< 25 min" },
  { priority: "Low", count: 26, eta: "< 60 min" },
];

export const customerServiceConversations: ConversationListItem[] = [
  {
    id: "cs-1042",
    customer: "Northwind Traders",
    channel: "Email",
    topic: "Delivery status request",
    preview: "Need immediate ETA confirmation for shipment 8841.",
    assignee: "Maya R.",
    priority: "High",
    status: "Open",
    updated: isoMinutesAgo(5),
  },
  {
    id: "cs-1041",
    customer: "Acme Retail",
    channel: "Phone",
    topic: "Invoice mismatch",
    preview: "Line-item discounts differ from submitted purchase order.",
    assignee: "Owen L.",
    priority: "Medium",
    status: "In Progress",
    updated: isoMinutesAgo(12),
  },
  {
    id: "cs-1040",
    customer: "Blue Ridge Co.",
    channel: "Chat",
    topic: "Workflow trigger failed",
    preview: "Approval workflow skipped for two incoming orders.",
    assignee: "Lena S.",
    priority: "High",
    status: "Escalated",
    updated: isoMinutesAgo(18),
  },
  {
    id: "cs-1039",
    customer: "Helios Health",
    channel: "Email",
    topic: "Inventory discrepancy",
    preview: "Count mismatch found between warehouse and dashboard totals.",
    assignee: "Unassigned",
    priority: "Medium",
    status: "Open",
    updated: isoMinutesAgo(31),
  },
  {
    id: "cs-1038",
    customer: "Metro Supplies",
    channel: "Chat",
    topic: "Damaged shipment",
    preview: "Outer carton damaged, requesting expedited replacement.",
    assignee: "Owen L.",
    priority: "Low",
    status: "Resolved",
    updated: isoMinutesAgo(42),
  },
  {
    id: "cs-1037",
    customer: "Summit Foods",
    channel: "Phone",
    topic: "API authentication",
    preview: "Token refresh failing after latest credential rotation.",
    assignee: "Unassigned",
    priority: "High",
    status: "In Progress",
    updated: isoMinutesAgo(53),
  },
  {
    id: "cs-1036",
    customer: "Orbit Parts",
    channel: "Email",
    topic: "Return authorization",
    preview: "Requesting RMA details for incorrect SKU batch.",
    assignee: "Maya R.",
    priority: "Medium",
    status: "Open",
    updated: isoMinutesAgo(60),
  },
  {
    id: "cs-1035",
    customer: "Canyon Logistics",
    channel: "Chat",
    topic: "Route optimization",
    preview: "Asking for route recommendation update in mountain region.",
    assignee: "Owen L.",
    priority: "Low",
    status: "Resolved",
    updated: isoMinutesAgo(60),
  },
];

export const customerServiceConversationById: Record<string, ConversationDetail> = {
  "cs-1042": {
    id: "cs-1042",
    customer: "Northwind Traders",
    channel: "Email",
    topic: "Delivery status request",
    assignee: "Maya R.",
    priority: "High",
    status: "Open",
    tags: ["shipping", "eta", "enterprise"],
    transcript: [
      {
        from: "Customer",
        text: "Can you confirm where shipment #8841 is right now?",
        time: "09:05",
      },
      {
        from: "Agent",
        text: "I checked with logistics and it is at the regional hub, expected this afternoon.",
        time: "09:08",
      },
      {
        from: "Customer",
        text: "Please notify us immediately if it slips to tomorrow.",
        time: "09:09",
      },
      {
        from: "Agent",
        text: "Understood. I set an alert and will follow up within 30 minutes.",
        time: "09:11",
      },
    ],
  },
  "cs-1041": {
    id: "cs-1041",
    customer: "Acme Retail",
    channel: "Phone",
    topic: "Invoice mismatch",
    assignee: "Owen L.",
    priority: "Medium",
    status: "In Progress",
    tags: ["billing", "finance"],
    transcript: [
      {
        from: "Customer",
        text: "The invoice total does not match the purchase order.",
        time: "10:14",
      },
      {
        from: "Agent",
        text: "I found the mismatch in line item discounts and sent this to finance for correction.",
        time: "10:19",
      },
    ],
  },
  "cs-1040": {
    id: "cs-1040",
    customer: "Blue Ridge Co.",
    channel: "Chat",
    topic: "Workflow trigger failed",
    assignee: "Lena S.",
    priority: "High",
    status: "Escalated",
    tags: ["workflow", "automation", "urgent"],
    transcript: [
      {
        from: "Customer",
        text: "Our approval workflow did not trigger for two orders.",
        time: "11:02",
      },
      {
        from: "Agent",
        text: "I can reproduce this in your environment and escalated it to platform engineering.",
        time: "11:05",
      },
    ],
  },
};
