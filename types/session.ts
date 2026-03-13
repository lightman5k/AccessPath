export type MockPlan = "free" | "pro" | "premium";

export type MockRole = "admin" | "agent";

export type MockSession = {
  plan: MockPlan;
  role: MockRole;
};

export type FeatureKey =
  | "workflowBuilder"
  | "pdfExport"
  | "salesforceIntegration"
  | "settingsAccess";
