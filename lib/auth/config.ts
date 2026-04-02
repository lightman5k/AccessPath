import { join } from "node:path";

const DEFAULT_SESSION_DAYS = 7;
const DEFAULT_REMEMBER_ME_DAYS = 30;
const DEFAULT_TRIAL_DAYS = 14;
const SECONDS_PER_DAY = 24 * 60 * 60;
const environment = process.env.NODE_ENV ?? "development";
const isDevelopment = environment === "development";
const isProduction = environment === "production";

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (typeof value === "undefined") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveCookieName() {
  const configuredName = process.env.AUTH_COOKIE_NAME?.trim();
  if (configuredName) return configuredName;
  return isProduction ? "__Host-accesspath_session" : "accesspath_session";
}

function resolveConfiguredAuthSecret() {
  const configuredSecret = process.env.AUTH_SECRET?.trim();
  return configuredSecret || null;
}

function resolveConfiguredDatabaseUrl() {
  const configuredDatabaseUrl = process.env.DATABASE_URL?.trim();
  return configuredDatabaseUrl || null;
}

const dataDirectory = join(process.cwd(), "data", "auth");

export const authConfig = {
  cookieName: resolveCookieName(),
  environment,
  isDevelopment,
  isProduction,
  sessionDays: parsePositiveInteger(process.env.AUTH_SESSION_DAYS, DEFAULT_SESSION_DAYS),
  rememberMeDays: parsePositiveInteger(
    process.env.AUTH_REMEMBER_ME_DAYS,
    DEFAULT_REMEMBER_ME_DAYS,
  ),
  trustProxyHeaders: parseBoolean(process.env.AUTH_TRUST_PROXY, false),
  trialDays: DEFAULT_TRIAL_DAYS,
  configuredSecret: resolveConfiguredAuthSecret(),
  databaseUrl: resolveConfiguredDatabaseUrl(),
  usersFilePath: join(dataDirectory, "users.json"),
  sessionsFilePath: join(dataDirectory, "sessions.json"),
  insightActionsFilePath: join(dataDirectory, "insight-actions.json"),
  integrationStatesFilePath: join(dataDirectory, "integration-states.json"),
  supportRecordsFilePath: join(dataDirectory, "support-records.json"),
  settingsFilePath: join(dataDirectory, "settings.json"),
  settingsAuditLogFilePath: join(dataDirectory, "settings-audit-log.json"),
  discussionThreadsFilePath: join(dataDirectory, "discussion-threads.json"),
  discussionCommentsFilePath: join(dataDirectory, "discussion-comments.json"),
  discussionVotesFilePath: join(dataDirectory, "discussion-votes.json"),
  rateLimits: {
    signInIp: { limit: 10, windowMs: 15 * 60 * 1000 },
    signInEmail: { limit: 5, windowMs: 15 * 60 * 1000 },
    signUpIp: { limit: 6, windowMs: 60 * 60 * 1000 },
    signUpEmail: { limit: 3, windowMs: 60 * 60 * 1000 },
  },
} as const;

export function getAuthSecret() {
  if (authConfig.configuredSecret) return authConfig.configuredSecret;
  if (authConfig.isDevelopment) return "dev-only-accesspath-auth-secret";
  throw new Error("AUTH_SECRET is required outside local development.");
}

export function getSessionMaxAgeSeconds(rememberMe: boolean) {
  const days = rememberMe ? authConfig.rememberMeDays : authConfig.sessionDays;
  return days * SECONDS_PER_DAY;
}

export function getSessionExpiresAt(rememberMe: boolean, now = new Date()) {
  return new Date(now.getTime() + getSessionMaxAgeSeconds(rememberMe) * 1000);
}

export function getTrialEndsAt(now = new Date()) {
  return new Date(now.getTime() + authConfig.trialDays * SECONDS_PER_DAY * 1000);
}


