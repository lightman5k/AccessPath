export type DateRange = "7d" | "30d" | "90d";

export type ModuleFilter = "all" | "Workflow Builder" | "Customer Service" | "Integrations";

export type ReportModule = Exclude<ModuleFilter, "all">;

export type ReportRecord = {
  id: string;
  name: string;
  module: ReportModule;
  createdAt: string;
  totalEvents: number;
  completionRate: number;
  errors: number;
};
