import { NextResponse } from "next/server";
import { getUserRepository } from "@/lib/auth/default-repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
  }

  await getUserRepository().deleteById(id);

  return NextResponse.json({ success: true });
}

