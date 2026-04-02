import { authConfig } from "./config";
import type { AuthRateLimitScope } from "@/types";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitRule = {
  scope: AuthRateLimitScope;
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function getStoreKey(scope: AuthRateLimitScope, key: string) {
  return `${scope}:${key}`;
}

function consumeRateLimit(rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const storeKey = getStoreKey(rule.scope, rule.key);
  const existing = rateLimitStore.get(storeKey);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(storeKey, {
      count: 1,
      resetAt: now + rule.windowMs,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= rule.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  rateLimitStore.set(storeKey, existing);
  return { allowed: true, retryAfterSeconds: 0 };
}

function applyRateLimitRules(rules: RateLimitRule[]): RateLimitResult {
  for (const rule of rules) {
    const result = consumeRateLimit(rule);
    if (!result.allowed) return result;
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

function normalizeIpAddress(ipAddress: string | null) {
  return ipAddress?.trim() || "unknown";
}

/**
 * Local in-memory auth throttling for the demo backend.
 * This only applies within a single running Node process and will not coordinate
 * across multiple instances or survive restarts.
 */
export function enforceSignupRateLimit(ipAddress: string | null, emailNormalized: string) {
  return applyRateLimitRules([
    {
      scope: "signup:ip",
      key: normalizeIpAddress(ipAddress),
      limit: authConfig.rateLimits.signUpIp.limit,
      windowMs: authConfig.rateLimits.signUpIp.windowMs,
    },
    {
      scope: "signup:email",
      key: emailNormalized,
      limit: authConfig.rateLimits.signUpEmail.limit,
      windowMs: authConfig.rateLimits.signUpEmail.windowMs,
    },
  ]);
}

/**
 * Local in-memory auth throttling for the demo backend.
 * This only applies within a single running Node process and will not coordinate
 * across multiple instances or survive restarts.
 */
export function enforceSigninRateLimit(ipAddress: string | null, emailNormalized: string) {
  return applyRateLimitRules([
    {
      scope: "signin:ip",
      key: normalizeIpAddress(ipAddress),
      limit: authConfig.rateLimits.signInIp.limit,
      windowMs: authConfig.rateLimits.signInIp.windowMs,
    },
    {
      scope: "signin:email",
      key: emailNormalized,
      limit: authConfig.rateLimits.signInEmail.limit,
      windowMs: authConfig.rateLimits.signInEmail.windowMs,
    },
  ]);
}
