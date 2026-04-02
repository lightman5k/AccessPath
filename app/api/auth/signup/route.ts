import { NextRequest, NextResponse } from "next/server";
import { setAuthSessionCookie } from "@/lib/auth/cookies";
import { getClientIpAddress, getRequestContext } from "@/lib/auth/current-session";
import { enforceSignupRateLimit } from "@/lib/auth/rate-limit";
import { AuthServiceError, authService } from "@/lib/auth/service";
import { validateSignupRequest } from "@/lib/auth/validation";
import type { AuthErrorResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildNoStoreHeaders(extraHeaders?: Record<string, string>) {
  return {
    "Cache-Control": "no-store",
    ...extraHeaders,
  };
}

function buildErrorResponse(body: AuthErrorResponse, status: number, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: buildNoStoreHeaders(extraHeaders),
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return buildErrorResponse(
      {
        error: "Invalid JSON body.",
        code: "invalid_request",
      },
      400,
    );
  }

  const validation = validateSignupRequest(body);
  if (!validation.success) {
    return buildErrorResponse(validation.error, 400);
  }

  const rateLimit = enforceSignupRateLimit(
    getClientIpAddress(request),
    validation.data.emailNormalized,
  );
  if (!rateLimit.allowed) {
    return buildErrorResponse(
      {
        error: "Too many signup attempts. Please try again later.",
        code: "rate_limited",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      429,
      {
        "Retry-After": String(rateLimit.retryAfterSeconds),
      },
    );
  }

  try {
    const result = await authService.signUp(validation.data, getRequestContext(request));
    const response = NextResponse.json(result.publicSession, {
      status: 201,
      headers: buildNoStoreHeaders(),
    });

    setAuthSessionCookie(response, result.rawSessionToken, result.expiresAt, result.rememberMe);
    return response;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return buildErrorResponse(
        {
          error: error.message,
          code: error.code,
        },
        error.status,
      );
    }

    return buildErrorResponse(
      {
        error: "Unable to process request.",
        code: "server_error",
      },
      500,
    );
  }
}
