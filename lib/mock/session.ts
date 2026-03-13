"use client";

import { useSyncExternalStore } from "react";
import { mockSessionStorageKey, readStoredMockSession, writeStoredMockSession } from "@/lib/storage/session";
import type { FeatureKey, MockPlan, MockRole, MockSession } from "@/types";

const mockSessionEvent = "mock-session:change";

export const defaultMockSession: MockSession = {
  plan: "free",
  role: "admin",
};

export const featureRequirements: Record<
  FeatureKey,
  {
    description: string;
    plan?: MockPlan;
    role?: MockRole;
  }
> = {
  workflowBuilder: {
    description: "Workflow Builder requires Pro or Premium.",
    plan: "pro",
  },
  pdfExport: {
    description: "PDF export is available on Premium only.",
    plan: "premium",
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

export function loadMockSession(): MockSession {
  return readStoredMockSession();
}

export function saveMockSession(session: MockSession) {
  if (typeof window === "undefined") return;
  writeStoredMockSession(session);
  window.dispatchEvent(new CustomEvent(mockSessionEvent, { detail: session }));
}

export function subscribeMockSession(onChange: (session: MockSession) => void) {
  if (typeof window === "undefined") return () => {};

  const handleSessionChange = (event: Event) => {
    const customEvent = event as CustomEvent<MockSession>;
    onChange(customEvent.detail ?? loadMockSession());
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== mockSessionStorageKey) return;
    onChange(loadMockSession());
  };

  window.addEventListener(mockSessionEvent, handleSessionChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(mockSessionEvent, handleSessionChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useMockSession() {
  return useSyncExternalStore(subscribeMockSession, loadMockSession, () => defaultMockSession);
}

const planRank: Record<MockPlan, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

export function hasFeatureAccess(session: MockSession, feature: FeatureKey) {
  const requirement = featureRequirements[feature];
  if (requirement.plan && planRank[session.plan] < planRank[requirement.plan]) {
    return false;
  }
  if (requirement.role && session.role !== requirement.role) {
    return false;
  }
  return true;
}
