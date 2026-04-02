import { NextRequest, NextResponse } from "next/server";
import { buildApiNoStoreHeaders, requireApiSession } from "@/lib/auth/api-guard";
import { FileSupportRecordRepository } from "@/lib/support-records/file-support-record-repository";
import { buildSupportRecordSourceSummary } from "@/lib/support-records/metrics";
import { validateSupportRecordInput } from "@/lib/support-records/validation";
import type {
  SupportRecordErrorResponse,
  SupportRecordsApiResponse,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: buildApiNoStoreHeaders(),
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<SupportRecordErrorResponse>({ error: "Authentication required." }, 401);
  }

  const repository = new FileSupportRecordRepository();
  const items = await repository.listByUserId(currentUser.id);
  const payload: SupportRecordsApiResponse = {
    generatedAt: new Date().toISOString(),
    items,
    summary: buildSupportRecordSourceSummary(items),
  };

  return jsonResponse(payload);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<SupportRecordErrorResponse>({ error: "Authentication required." }, 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse<SupportRecordErrorResponse>({ error: "Invalid JSON body." }, 400);
  }

  const validation = validateSupportRecordInput(body);
  if (!validation.success) {
    return jsonResponse<SupportRecordErrorResponse>(validation.error, 400);
  }

  const repository = new FileSupportRecordRepository();
  await repository.create(currentUser.id, validation.data, {
    sourceType: "manual",
    inputMethod: "form",
  });

  const items = await repository.listByUserId(currentUser.id);
  const payload: SupportRecordsApiResponse = {
    generatedAt: new Date().toISOString(),
    items,
    summary: buildSupportRecordSourceSummary(items),
  };

  return jsonResponse(payload, 201);
}
