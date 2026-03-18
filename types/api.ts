import type { DashboardAiRecommendation, DashboardInteraction, DashboardKpi } from "./dashboard";

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
