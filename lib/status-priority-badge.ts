import type { BadgeVariant } from "@/components/ui/badge";
import type {
  ConversationStatus,
  IntegrationStatus,
  InventoryStatus,
  LogisticsRouteStatus,
  QueuePriority,
} from "@/types";

type BadgeMeta = {
  variant: BadgeVariant;
  label: string;
};

const conversationStatusMeta: Record<ConversationStatus, BadgeMeta> = {
  Open: { variant: "warning", label: "Open" },
  "In Progress": { variant: "info", label: "In Progress" },
  Resolved: { variant: "success", label: "Resolved" },
  Escalated: { variant: "danger", label: "Escalated" },
};

const queuePriorityMeta: Record<QueuePriority, BadgeMeta> = {
  High: { variant: "danger", label: "High" },
  Medium: { variant: "warning", label: "Medium" },
  Low: { variant: "success", label: "Low" },
};

const integrationStatusMeta: Record<IntegrationStatus, BadgeMeta> = {
  connected: { variant: "success", label: "Connected" },
  syncing: { variant: "info", label: "Syncing" },
  error: { variant: "danger", label: "Error" },
  "not-connected": { variant: "neutral", label: "Not Connected" },
};

const inventoryStatusMeta: Record<InventoryStatus, BadgeMeta> = {
  Healthy: { variant: "success", label: "Healthy" },
  "Low Stock": { variant: "warning", label: "Low Stock" },
  Critical: { variant: "danger", label: "Critical" },
};

const logisticsStatusMeta: Record<LogisticsRouteStatus, BadgeMeta> = {
  "On Time": { variant: "success", label: "On Time" },
  "At Risk": { variant: "warning", label: "At Risk" },
  Delayed: { variant: "danger", label: "Delayed" },
};

const auditStatusMeta: Record<"Success" | "Warning" | "Failed", BadgeMeta> = {
  Success: { variant: "success", label: "Success" },
  Warning: { variant: "warning", label: "Warning" },
  Failed: { variant: "danger", label: "Failed" },
};

export function badgeMetaForStatus(status: ConversationStatus): BadgeMeta {
  return conversationStatusMeta[status];
}

export function badgeMetaForPriority(priority: QueuePriority): BadgeMeta {
  return queuePriorityMeta[priority];
}

export function badgeVariantForStatus(status: ConversationStatus): BadgeVariant {
  return badgeMetaForStatus(status).variant;
}

export function badgeVariantForPriority(
  priority: QueuePriority,
): BadgeVariant {
  return badgeMetaForPriority(priority).variant;
}

export function badgeMetaForIntegrationStatus(
  status: IntegrationStatus,
): BadgeMeta {
  return integrationStatusMeta[status];
}

export function badgeMetaForInventoryStatus(status: InventoryStatus): BadgeMeta {
  return inventoryStatusMeta[status];
}

export function badgeMetaForLogisticsStatus(
  status: LogisticsRouteStatus,
): BadgeMeta {
  return logisticsStatusMeta[status];
}

export function badgeMetaForAuditStatus(
  status: "Success" | "Warning" | "Failed",
): BadgeMeta {
  return auditStatusMeta[status];
}
