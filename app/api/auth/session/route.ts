import { NextRequest, NextResponse } from "next/server";
import { buildApiNoStoreHeaders } from "@/lib/auth/api-guard";
import { getCurrentSessionFromRequest } from "@/lib/auth/current-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSessionFromRequest(request, true);
    return NextResponse.json(session, {
      headers: buildApiNoStoreHeaders(),
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to process request.",
        code: "server_error",
      },
      {
        status: 500,
        headers: buildApiNoStoreHeaders(),
      },
    );
  }
}
