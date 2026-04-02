import { NextRequest, NextResponse } from "next/server";
import { buildApiNoStoreHeaders, requireApiSession } from "@/lib/auth/api-guard";
import { parseSupportRecordCsvImport } from "@/lib/support-records/csv";
import { getSupportRecordRepository } from "@/lib/support-records/default-repository";
import { buildSupportRecordSourceSummary } from "@/lib/support-records/metrics";
import type {
  ImportSupportRecordsRequest,
  SupportRecordErrorResponse,
  SupportRecordImportResponse,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: buildApiNoStoreHeaders(),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<SupportRecordErrorResponse>({ error: "Authentication required." }, 401);
  }

  let body: ImportSupportRecordsRequest | null = null;

  try {
    body = (await request.json()) as ImportSupportRecordsRequest;
  } catch {
    return jsonResponse<SupportRecordErrorResponse>({ error: "Invalid JSON body." }, 400);
  }

  const parsedImport = parseSupportRecordCsvImport({
    sourceName: body?.sourceName ?? "",
    csvText: body?.csvText ?? "",
  });
  if (!parsedImport.success) {
    return jsonResponse<SupportRecordErrorResponse>(parsedImport.error, 400);
  }

  const repository = getSupportRecordRepository();

  try {
    await repository.createMany(currentUser.id, parsedImport.data, {
      sourceType: "csv",
      inputMethod: "csv",
    });

    const items = await repository.listByUserId(currentUser.id);
    const summary = buildSupportRecordSourceSummary(items);
    if (!summary) {
      return jsonResponse<SupportRecordErrorResponse>(
        { error: "Imported records could not be summarized." },
        500,
      );
    }

    const payload: SupportRecordImportResponse = {
      importedCount: parsedImport.data.length,
      summary,
    };

    return jsonResponse(payload, 201);
  } catch (error) {
    console.error("Support record CSV import failed.", error);
    return jsonResponse<SupportRecordErrorResponse>(
      { error: "Unable to import support records right now." },
      500,
    );
  }
}

