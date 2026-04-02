import type { FeatureKey, MockPlan, MockRole, PublicSession } from "@/types";

type FeatureRequirement = {
  description: string;
  plan?: MockPlan;
  role?: MockRole;
};

type SessionAccessShape = Pick<PublicSession, "plan" | "role">;

export const featureRequirements: Record<FeatureKey, FeatureRequirement> = {
  workflowBuilder: {
    description: "Workflow Builder requires Pro or Premium.",
    plan: "pro",
  },
  salesforceIntegration: {
    description: "Salesforce integration requires Pro or Premium.",
    plan: "pro",
  },
  settingsAccess: {
    description: "Settings access is restricted to admin users.",
    role: "admin",
  },
};

const planRank: Record<MockPlan, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

export function hasFeatureAccess(session: SessionAccessShape, feature: FeatureKey) {
  if (!session.plan || !session.role) return false;

  const requirement = featureRequirements[feature];
  if (requirement.plan && planRank[session.plan] < planRank[requirement.plan]) {
    return false;
  }
  if (requirement.role && session.role !== requirement.role) {
    return false;
  }
  return true;
}
