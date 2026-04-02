import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionFromRequest } from "./current-session";
import type { AuthErrorResponse, PublicSession } from "@/types";

export function buildApiNoStoreHeaders(extraHeaders?: Record<string, string>) {
  return {
    "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Cookie",
    ...extraHeaders,
  };
}

export function buildApiErrorResponse(
  body: AuthErrorResponse,
  status: number,
  extraHeaders?: Record<string, string>,
) {
  return NextResponse.json(body, {
    status,
    headers: buildApiNoStoreHeaders(extraHeaders),
  });
}

type AuthenticatedApiSessionResult =
  | {
      ok: true;
      session: PublicSession;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireApiSession(
  request: NextRequest,
): Promise<AuthenticatedApiSessionResult> {
  try {
    const session = await getCurrentSessionFromRequest(request, true);
    if (!session.authenticated) {
      return {
        ok: false,
        response: buildApiErrorResponse(
          {
            error: "Authentication required.",
            code: "unauthorized",
          },
          401,
        ),
      };
    }

    return {
      ok: true,
      session,
    };
  } catch (error) {
    console.error("API auth/session guard failed.", error);
    return {
      ok: false,
      response: buildApiErrorResponse(
        {
          error: "Unable to process request.",
          code: "server_error",
        },
        500,
      ),
    };
  }
}
