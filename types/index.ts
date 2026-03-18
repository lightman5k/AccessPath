export type { DashboardAiRecommendation, DashboardInteraction, DashboardKpi } from "./dashboard";
export type {
  ChatIntent,
  ChatMessageTurn,
  ChatRequest,
  ChatResponse,
  DashboardApiResponse,
  DashboardRange,
  DashboardTrendPoint,
  InsightCategory,
  InsightItem,
  InsightPriority,
  InsightStatus,
  InsightsApiResponse,
} from "./api";
export type {
  ConversationDetail,
  ConversationListOverride,
  ConversationListItem,
  ConversationLocalState,
  ConversationMessage,
  ConversationStatus,
  ConversationTimelineEntry,
  CustomerServiceKpi,
  HandoffReason,
  HandoffTicket,
  QueueItem,
  QueuePriority,
} from "./customer-service";
export type {
  ActionNodeConfig,
  ConditionNodeConfig,
  TriggerNodeConfig,
  Workflow,
  WorkflowNode,
  WorkflowNodeConfigMap,
  WorkflowNodeType,
} from "./workflow";
export type {
  IntegrationCatalogItem,
  IntegrationId,
  IntegrationItem,
  IntegrationStatus,
} from "./integrations";
export type { DateRange, ModuleFilter, ReportModule, ReportRecord } from "./reports";
export type {
  InventoryAiAction,
  InventoryCategory,
  InventoryItem,
  InventoryKpi,
  InventoryStatus,
} from "./inventory";
export type {
  LogisticsKpi,
  LogisticsRegion,
  LogisticsRoute,
  LogisticsRouteStatus,
} from "./logistics";
export type { AuditLogStatus, SettingsAuditLogEntry, SettingsState } from "./settings";
export type { FeatureKey, MockPlan, MockRole, MockSession } from "./session";
