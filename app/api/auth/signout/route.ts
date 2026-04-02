import { NextRequest, NextResponse } from "next/server";
import { buildApiNoStoreHeaders } from "@/lib/auth/api-guard";
import { clearAuthSessionCookie } from "@/lib/auth/cookies";
import { getRawSessionTokenFromRequest } from "@/lib/auth/current-session";
import { authService } from "@/lib/auth/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    {
      success: true,
      authenticated: false,
    },
    {
      headers: buildApiNoStoreHeaders(),
    },
  );

  clearAuthSessionCookie(response);

  try {
    await authService.revokeSession(getRawSessionTokenFromRequest(request));
    return response;
  } catch (error) {
    console.error("Auth signout revoke failed.", error);
    return response;
  }
}
