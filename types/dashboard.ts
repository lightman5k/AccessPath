import type { ConversationStatus } from "./customer-service";

export type DashboardKpi = {
  label: string;
  value: string;
  change: string;
  trend: string;
};

export type DashboardInteraction = {
  id: string;
  customer: string;
  channel: string;
  issue: string;
  status: ConversationStatus;
  updated: string;
};

export type DashboardAiRecommendation = {
  id: string;
  title: string;
  description: string;
  impact: "Low" | "Medium" | "High";
  category: string;
};
