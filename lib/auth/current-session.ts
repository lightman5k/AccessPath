import type { NextRequest } from "next/server";
import { readAuthSessionCookie } from "./cookies";
import { authConfig } from "./config";
import { authService } from "./service";
import type { AuthRequestContext } from "@/types";

function normalizeHeaderValue(value: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 1024) return null;
  return trimmed;
}

function normalizeIpCandidate(value: string | null) {
  const normalized = normalizeHeaderValue(value);
  if (!normalized) return null;

  const firstSegment = normalized.split(",")[0]?.trim() ?? "";
  if (!firstSegment || firstSegment.length > 128) return null;
  return firstSegment;
}

export function getClientIpAddress(request: NextRequest) {
  if (!authConfig.trustProxyHeaders) {
    return null;
  }

  const forwardedFor = normalizeHeaderValue(request.headers.get("x-forwarded-for"));
  if (forwardedFor) {
    return normalizeIpCandidate(forwardedFor);
  }

  return normalizeIpCandidate(request.headers.get("x-real-ip"));
}

export function getRequestContext(request: NextRequest): AuthRequestContext {
  return {
    ipAddress: getClientIpAddress(request),
    userAgent: request.headers.get("user-agent")?.trim().slice(0, 512) || null,
  };
}

export function getRawSessionTokenFromRequest(request: NextRequest) {
  return readAuthSessionCookie(request);
}

export async function getCurrentSessionFromRequest(request: NextRequest, touchSession: boolean = false) {
  const token = getRawSessionTokenFromRequest(request);
  if (!token) return authService.getSessionFromToken(token);
  return touchSession ? authService.getSessionFromTokenWithTouch(token) : authService.getSessionFromToken(token);
}
