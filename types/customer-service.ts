export type ConversationStatus = "Open" | "In Progress" | "Resolved" | "Escalated";
export type QueuePriority = "High" | "Medium" | "Low";

export type CustomerServiceKpi = {
  label: string;
  value: string;
  note: string;
};

export type QueueItem = {
  priority: QueuePriority;
  count: number;
  eta: string;
};

export type ConversationListItem = {
  id: string;
  customer: string;
  channel: string;
  topic: string;
  preview: string;
  assignee: string;
  priority: QueuePriority;
  status: ConversationStatus;
  updated: string;
};

export type ConversationMessage = {
  from: "Agent" | "Customer";
  text: string;
  time: string;
};

export type ConversationTimelineEntry = {
  id: string;
  time: string;
  text: string;
};

export type ConversationDetail = {
  id: string;
  customer: string;
  channel: string;
  topic: string;
  assignee: string;
  priority: QueuePriority;
  status: ConversationStatus;
  tags: string[];
  transcript: ConversationMessage[];
};

export type HandoffReason = "Billing" | "Technical" | "Complaint" | "Other";

export type HandoffTicket = {
  id: string;
  reason: HandoffReason;
  priority: QueuePriority;
  notes?: string;
  createdAt: string;
};

export type ConversationLocalState = {
  status: ConversationStatus;
  assignee: string;
  priority: QueuePriority;
  notes: string;
  timeline: ConversationTimelineEntry[];
  handoffTicket: HandoffTicket | null;
  updatedAt?: string;
};

export type ConversationListOverride = {
  status?: ConversationStatus;
  assignee?: string;
  priority?: QueuePriority;
  updatedAt?: string;
  hasHandoffTicket?: boolean;
};
