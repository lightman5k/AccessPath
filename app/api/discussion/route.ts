import { NextRequest, NextResponse } from "next/server";
import { buildApiNoStoreHeaders, requireApiSession } from "@/lib/auth/api-guard";
import { getDiscussionRepository } from "@/lib/discussions/default-repository";
import { buildDiscussionAuthor, buildDiscussionPayload } from "@/lib/discussions/service";
import { validateCreateDiscussionThread } from "@/lib/discussions/validation";
import type { DiscussionErrorResponse } from "@/types";

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
    return jsonResponse<DiscussionErrorResponse>({ error: "Authentication required." }, 401);
  }

  try {
    return jsonResponse(await buildDiscussionPayload(currentUser.id));
  } catch (error) {
    console.error("Discussion GET failed.", error);
    return jsonResponse<DiscussionErrorResponse>({ error: "Unable to load discussion threads." }, 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<DiscussionErrorResponse>({ error: "Authentication required." }, 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse<DiscussionErrorResponse>({ error: "Invalid JSON body." }, 400);
  }

  const validation = validateCreateDiscussionThread(body);
  if (!validation.success) {
    return jsonResponse<DiscussionErrorResponse>(validation.error, 400);
  }

  try {
    const repository = getDiscussionRepository();
    const author = buildDiscussionAuthor(currentUser);
    const createdThread = await repository.createThread({
      title: validation.data.title,
      body: validation.data.body,
      excerpt:
        validation.data.body.length > 140
          ? `${validation.data.body.slice(0, 137)}...`
          : validation.data.body,
      tag: validation.data.tag,
      author,
      collaborationSuggested:
        validation.data.tag === "Operations" || validation.data.tag === "Integrations",
    });
    await repository.setVote(currentUser.id, createdThread.id, "up", false);

    return jsonResponse(await buildDiscussionPayload(currentUser.id, createdThread.id), 201);
  } catch (error) {
    console.error("Discussion POST failed.", error);
    return jsonResponse<DiscussionErrorResponse>(
      { error: "Unable to publish the discussion thread." },
      500,
    );
  }
}

