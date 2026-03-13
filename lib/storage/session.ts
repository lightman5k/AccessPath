import type { MockPlan, MockRole, MockSession } from "@/types";

export const mockSessionStorageKey = "mock-session:v1";
const defaultStoredMockSession: MockSession = {
  plan: "free",
  role: "admin",
};
let cachedMockSession: MockSession = defaultStoredMockSession;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizePlan(value: unknown): MockPlan {
  if (value === "pro" || value === "premium") return value;
  return "free";
}

function sanitizeRole(value: unknown): MockRole {
  if (value === "agent") return value;
  return "admin";
}

export function readStoredMockSession(): MockSession {
  if (!canUseStorage()) return cachedMockSession;
  const raw = window.localStorage.getItem(mockSessionStorageKey);
  if (!raw) {
    cachedMockSession = defaultStoredMockSession;
    return cachedMockSession;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MockSession>;
    const nextSession = {
      plan: sanitizePlan(parsed.plan),
      role: sanitizeRole(parsed.role),
    };
    if (
      cachedMockSession.plan === nextSession.plan &&
      cachedMockSession.role === nextSession.role
    ) {
      return cachedMockSession;
    }
    cachedMockSession = nextSession;
    return cachedMockSession;
  } catch {
    cachedMockSession = defaultStoredMockSession;
    return cachedMockSession;
  }
}

export function writeStoredMockSession(session: MockSession) {
  if (!canUseStorage()) return;
  cachedMockSession = session;
  window.localStorage.setItem(mockSessionStorageKey, JSON.stringify(session));
}

export function clearStoredMockSession() {
  if (!canUseStorage()) return;
  cachedMockSession = defaultStoredMockSession;
  window.localStorage.removeItem(mockSessionStorageKey);
}
