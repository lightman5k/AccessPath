import { NextRequest, NextResponse } from "next/server";
import { FileUserRepository } from "@/lib/auth/file-user-repository";
import type { MockPlan, MockRole } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validPlans = new Set<MockPlan>(["free", "pro", "premium"]);
const validRoles = new Set<MockRole>(["admin", "agent"]);

function isMockPlan(value: unknown): value is MockPlan {
  return typeof value === "string" && validPlans.has(value as MockPlan);
}

function isMockRole(value: unknown): value is MockRole {
  return typeof value === "string" && validRoles.has(value as MockRole);
}

export async function GET() {
  const users = await new FileUserRepository().findAll();
  return NextResponse.json({ success: true, users });
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
  }

  await new FileUserRepository().deleteById(id);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const plan = body?.plan;
  const role = body?.role;

  if ((typeof plan !== "string" || !plan.trim()) && (typeof role !== "string" || !role.trim())) {
    return NextResponse.json({ success: false, error: "Plan or role is required." }, { status: 400 });
  }

  if (typeof plan === "string" && plan.trim() && !isMockPlan(plan.trim())) {
    return NextResponse.json(
      { success: false, error: "Plan must be free, pro, or premium." },
      { status: 400 },
    );
  }

  if (typeof role === "string" && role.trim() && !isMockRole(role.trim())) {
    return NextResponse.json({ success: false, error: "Role must be admin or agent." }, { status: 400 });
  }

  try {
    const repo = new FileUserRepository();
    let user;

    if (typeof plan === "string" && plan.trim()) {
      user = await repo.updatePlan(id, plan.trim() as MockPlan);
    }

    if (typeof role === "string" && role.trim()) {
      user = await repo.updateRole(id, role.trim() as MockRole);
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Unable to update user details." }, { status: 500 });
  }
}
