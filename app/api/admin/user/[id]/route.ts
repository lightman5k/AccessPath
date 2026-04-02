import { NextResponse } from "next/server";
import { FileUserRepository } from "@/lib/auth/file-user-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
  }

  await new FileUserRepository().deleteById(id);

  return NextResponse.json({ success: true });
}
