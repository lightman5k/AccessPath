import { NextRequest, NextResponse } from "next/server";
import { buildApiNoStoreHeaders, requireApiSession } from "@/lib/auth/api-guard";
import { FileDiscussionRepository } from "@/lib/discussions/file-discussion-repository";
import { buildDiscussionPayload } from "@/lib/discussions/service";
import { validateDiscussionModeration } from "@/lib/discussions/validation";
import type { DiscussionErrorResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: buildApiNoStoreHeaders(),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ threadId: string }> },
) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<DiscussionErrorResponse>({ error: "Authentication required." }, 401);
  }

  if (currentUser.role !== "admin") {
    return jsonResponse<DiscussionErrorResponse>(
      { error: "Only admins can moderate discussion threads." },
      403,
    );
  }

  const { threadId } = await context.params;
  if (!threadId) {
    return jsonResponse<DiscussionErrorResponse>({ error: "Thread ID is required." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse<DiscussionErrorResponse>({ error: "Invalid JSON body." }, 400);
  }

  const validation = validateDiscussionModeration(body);
  if (!validation.success) {
    return jsonResponse<DiscussionErrorResponse>(validation.error, 400);
  }

  try {
    const repository = new FileDiscussionRepository();
    const updatedThread = await repository.moderateThread(threadId, validation.data.action);
    if (!updatedThread) {
      return jsonResponse<DiscussionErrorResponse>({ error: "Discussion thread not found." }, 404);
    }

    return jsonResponse(await buildDiscussionPayload(currentUser.id, threadId));
  } catch (error) {
    console.error("Discussion moderation PATCH failed.", error);
    return jsonResponse<DiscussionErrorResponse>(
      { error: "Unable to update the discussion thread." },
      500,
    );
  }
}
