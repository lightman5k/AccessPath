import type {
  DashboardAiRecommendation,
  DashboardInteraction,
  DashboardKpi,
  DashboardSummaryCard,
} from "./dashboard";
import type { PublicSession } from "./auth";
import type { DiscussionTag, DiscussionThread, DiscussionVoteDirection } from "./discussion";
import type {
  IntegrationId,
  IntegrationStatus,
} from "./integrations";
import type {
  SupportRecordCategory,
  SupportRecordChannel,
  SupportRecordImportRowError,
  SupportRecordInput,
  SupportRecordSourceSummary,
  StoredSupportRecord,
} from "./support-records";

export type DashboardRange = "7d" | "30d" | "90d";

export type DashboardTrendPoint = {
  label: string;
  conversations: number;
  resolutionRate: number;
  avgResponseMinutes: number;
};

export type DashboardApiResponse = {
  range: DashboardRange;
  generatedAt: string;
  hasData: boolean;
  kpis: DashboardKpi[];
  summaries: DashboardSummaryCard[];
  trend: DashboardTrendPoint[];
  recentActivity: DashboardInteraction[];
  aiRecommendations: DashboardAiRecommendation[];
};

export type InsightPriority = "high" | "medium" | "low";
export type InsightCategory = "Support" | "Operations" | "Automation" | "Knowledge";
export type InsightStatus = "new" | "in-review" | "ready";
export type InsightDecision = "pending" | "applied" | "dismissed" | "escalated";
export type InsightAction = "review" | "apply" | "dismiss" | "escalate";

export type InsightItem = {
  id: string;
  title: string;
  category: InsightCategory;
  supportCategory?: SupportRecordCategory | "all";
  priority: InsightPriority;
  confidence: number;
  recommendation: string;
  reason: string;
  estimatedTimeSaved: string;
  automationOpportunity: boolean;
  status: InsightStatus;
  decision: InsightDecision;
  decisionUpdatedAt?: string;
};

export type InsightsApiResponse = {
  generatedAt: string;
  items: InsightItem[];
};

export type UpdateInsightRequest = {
  insightId: string;
  action: InsightAction;
};

export type InsightsErrorResponse = {
  error: string;
};

export type StoredInsightActionState = {
  userId: string;
  insightId: string;
  status: InsightStatus;
  decision: InsightDecision;
  updatedAt: string;
};

export type ChatMessageTurn = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequest = {
  message: string;
  conversationId?: string;
  channel?: string;
  customer?: string;
  history?: ChatMessageTurn[];
};

export type ChatIntent =
  | "booking"
  | "pricing"
  | "refund"
  | "order_status"
  | "business_hours"
  | "human_handoff"
  | "general_faq";

export type ChatResponse = {
  reply: string;
  intent: ChatIntent;
  confidence: number;
  handoffRecommended: boolean;
  suggestedNextAction?: string;
  reason?: string;
  matchedFaq?: string;
  conversationId?: string;
};

export type ScheduleRequest = {
  message: string;
  preferredDate?: string;
  timezone?: string;
  durationMinutes?: number;
};

export type ScheduleSlot = {
  id: string;
  startIso: string;
  endIso: string;
  label: string;
  timezone: string;
};

export type ScheduleResponse = {
  intent: "booking";
  confidence: number;
  reply: string;
  availableSlots: ScheduleSlot[];
  suggestedNextAction?: string;
};

export type IntegrationSyncState = "idle" | "syncing" | "error";

export type IntegrationAction = "connect" | "reconnect" | "manage";

export type IntegrationMutationAction =
  | "connect"
  | "disconnect"
  | "test";

export type IntegrationApiItem = {
  id: IntegrationId;
  name: string;
  provider: string;
  category: string;
  description: string;
  status: IntegrationStatus;
  syncState: IntegrationSyncState;
  lastSyncAt?: string;
  availableActions?: IntegrationAction[];
  manualSummary?: SupportRecordSourceSummary;
};

export type IntegrationsApiResponse = {
  generatedAt: string;
  items: IntegrationApiItem[];
};

export type UpdateIntegrationRequest = {
  integrationId: IntegrationId;
  action: IntegrationMutationAction;
};

export type IntegrationErrorResponse = {
  error: string;
};

export type SupportMetricsChannelFilter = "all" | SupportRecordChannel;

export type SupportMetricsCategoryFilter = "all" | SupportRecordCategory;

export type SupportMetricsTrendPoint = {
  label: string;
  conversations: number;
  resolutionRate: number;
  avgResponseMinutes: number;
};

export type SupportMetricsBreakdownItem = {
  label: string;
  share: string;
  volume: string;
  trend: string;
};

export type SupportMetricsSnapshotStatus = "Ready" | "Alert" | "Review";

export type SupportMetricsSnapshot = {
  id: string;
  snapshot: string;
  summary: string;
  status: SupportMetricsSnapshotStatus;
  updatedAt: string;
};

export type SupportMetricsSummary = {
  totalConversations: number;
  resolutionRate: number;
  avgResponseMinutes: number;
  escalationRate: number;
  openConversations: number;
  escalatedConversations: number;
  highPriorityOpenConversations: number;
};

export type SupportMetricsApiResponse = {
  generatedAt: string;
  timeframe: DashboardRange;
  channel: SupportMetricsChannelFilter;
  category: SupportMetricsCategoryFilter;
  hasData: boolean;
  summary: SupportMetricsSummary;
  trend: SupportMetricsTrendPoint[];
  breakdown: SupportMetricsBreakdownItem[];
  snapshots: SupportMetricsSnapshot[];
  recentRecords: DashboardInteraction[];
};

export type SupportRecordsApiResponse = {
  generatedAt: string;
  items: StoredSupportRecord[];
  summary: SupportRecordSourceSummary | null;
};

export type CreateSupportRecordRequest = SupportRecordInput;

export type ImportSupportRecordsRequest = {
  sourceName: string;
  csvText: string;
};

export type SupportRecordImportResponse = {
  importedCount: number;
  summary: SupportRecordSourceSummary;
};

export type SupportRecordErrorResponse = {
  error: string;
  fieldErrors?: Partial<Record<keyof SupportRecordInput | "csvText", string>>;
  rowErrors?: SupportRecordImportRowError[];
};

export type DiscussionApiResponse = {
  generatedAt: string;
  items: DiscussionThread[];
  focusThreadId?: string;
};

export type CreateDiscussionThreadRequest = {
  title: string;
  body: string;
  tag: DiscussionTag;
};

export type CreateDiscussionCommentRequest = {
  body: string;
};

export type UpdateDiscussionVoteRequest = {
  direction: DiscussionVoteDirection;
};

export type DiscussionErrorResponse = {
  error: string;
  fieldErrors?: Partial<Record<"title" | "body" | "tag" | "direction", string>>;
};

export type AuthSignupRequest = {
  fullName: string;
  email: string;
  companyName: string;
  password: string;
  rememberMe?: boolean;
};

export type AuthSigninRequest = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type AuthSessionResponse = PublicSession;

export type AuthSignoutResponse = {
  success: true;
  authenticated: false;
};

export type AuthErrorCode =
  | "invalid_request"
  | "invalid_credentials"
  | "rate_limited"
  | "unauthorized"
  | "conflict"
  | "server_error";

export type AuthErrorField = "fullName" | "email" | "companyName" | "password" | "rememberMe";

export type AuthErrorResponse = {
  error: string;
  code: AuthErrorCode;
  retryAfterSeconds?: number;
  fieldErrors?: Partial<Record<AuthErrorField, string>>;
};




