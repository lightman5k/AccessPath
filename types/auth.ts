import type { MockPlan, MockRole } from "./session";

export type PasswordHashVersion = "scrypt:v1";

export type StoredUserStatus = "active";

export type StoredUser = {
  id: string;
  email: string;
  emailNormalized: string;
  fullName: string;
  companyName: string;
  passwordHash: string;
  role: MockRole;
  plan: MockPlan;
  trialEndsAt: string | null;
  status: StoredUserStatus;
  createdAt: string;
  updatedAt: string;
};

export type StoredSession = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
  expiresAt: string;
  rememberMe: boolean;
  ipAddress: string | null;
  userAgent: string | null;
};

export type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  role: MockRole;
  plan: MockPlan;
  trialEndsAt: string | null;
  createdAt: string;
};

export type PublicSession = {
  authenticated: boolean;
  user: PublicUser | null;
  plan: MockPlan | null;
  role: MockRole | null;
  expiresAt: string | null;
};

export type AuthRequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

export type AuthRateLimitScope =
  | "signup:ip"
  | "signup:email"
  | "signin:ip"
  | "signin:email";
