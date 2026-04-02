import { NextRequest, NextResponse } from "next/server";
import { buildApiNoStoreHeaders, requireApiSession } from "@/lib/auth/api-guard";
import { FileDiscussionRepository } from "@/lib/discussions/file-discussion-repository";
import { buildDiscussionAuthor, buildDiscussionPayload } from "@/lib/discussions/service";
import { validateCreateDiscussionComment } from "@/lib/discussions/validation";
import type { DiscussionErrorResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: buildApiNoStoreHeaders(),
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ threadId: string }> },
) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<DiscussionErrorResponse>({ error: "Authentication required." }, 401);
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

  const validation = validateCreateDiscussionComment(body);
  if (!validation.success) {
    return jsonResponse<DiscussionErrorResponse>(validation.error, 400);
  }

  try {
    const repository = new FileDiscussionRepository();
    const existingThread = await repository.findThreadById(threadId);
    if (!existingThread) {
      return jsonResponse<DiscussionErrorResponse>({ error: "Discussion thread not found." }, 404);
    }

    if (existingThread.locked) {
      return jsonResponse<DiscussionErrorResponse>({ error: "This discussion thread is locked." }, 409);
    }

    await repository.createComment(threadId, {
      body: validation.data.body,
      author: buildDiscussionAuthor(currentUser),
    });

    return jsonResponse(await buildDiscussionPayload(currentUser.id, threadId), 201);
  } catch (error) {
    console.error("Discussion comment POST failed.", error);
    return jsonResponse<DiscussionErrorResponse>({ error: "Unable to post the reply." }, 500);
  }
}
