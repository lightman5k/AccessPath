import type { DashboardAiRecommendation, DashboardInteraction, DashboardKpi } from "./dashboard";
import type { IntegrationId, IntegrationStatus } from "./integrations";

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
  kpis: DashboardKpi[];
  trend: DashboardTrendPoint[];
  recentActivity: DashboardInteraction[];
  aiRecommendations: DashboardAiRecommendation[];
};

export type InsightPriority = "high" | "medium" | "low";
export type InsightCategory = "Support" | "Operations" | "Automation" | "Knowledge";
export type InsightStatus = "new" | "in-review" | "ready";

export type InsightItem = {
  id: string;
  title: string;
  category: InsightCategory;
  priority: InsightPriority;
  confidence: number;
  recommendation: string;
  reason: string;
  estimatedTimeSaved: string;
  automationOpportunity: boolean;
  status: InsightStatus;
};

export type InsightsApiResponse = {
  generatedAt: string;
  items: InsightItem[];
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
};

export type IntegrationsApiResponse = {
  generatedAt: string;
  items: IntegrationApiItem[];
};
