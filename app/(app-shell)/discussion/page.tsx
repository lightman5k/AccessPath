"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, PageHeader, Toast } from "@/components/ui";
import { useAuthSession } from "@/lib/auth/use-auth-session";
import type {
  CreateDiscussionCommentRequest,
  CreateDiscussionThreadRequest,
  DiscussionApiResponse,
  DiscussionErrorResponse,
  DiscussionTag,
  DiscussionThread,
  DiscussionVoteDirection,
  UpdateDiscussionVoteRequest,
} from "@/types";
import type { DiscussionModerationAction } from "@/types/discussion";

type SortMode = "latest" | "popular" | "needs-reply";

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Popular" },
  { value: "needs-reply", label: "Needs Reply" },
];

function tagVariant(tag: DiscussionTag) {
  if (tag === "Support") return "warning" as const;
  if (tag === "Integrations") return "success" as const;
  if (tag === "Security") return "danger" as const;
  return "info" as const;
}

function statusMeta(status: DiscussionThread["status"]) {
  if (status === "resolved") return { label: "Resolved", variant: "success" as const };
  if (status === "needs-reply") return { label: "Needs Reply", variant: "warning" as const };
  return { label: "Active", variant: "info" as const };
}

function formatIsoAsAgo(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;

  const minutes = Math.max(0, Math.floor((Date.now() - parsed) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1_440)}d ago`;
}

function scoreThread(thread: DiscussionThread) {
  return thread.voteCount * 3 + thread.replyCount * 2 + (thread.pinned ? 8 : 0);
}

export default function DiscussionPage() {
  const { session } = useAuthSession();
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<DiscussionTag>("Operations");
  const [replyBody, setReplyBody] = useState("");
  const [composerError, setComposerError] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const [submittingThread, setSubmittingThread] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [votingThreadId, setVotingThreadId] = useState<string | null>(null);
  const [moderatingAction, setModeratingAction] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [timeTick, setTimeTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setTimeTick((current) => current + 1), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDiscussion() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/discussion", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as DiscussionApiResponse | DiscussionErrorResponse;

        if (!response.ok || !("items" in payload)) {
          throw new Error("error" in payload ? payload.error : "Unable to load discussion threads.");
        }

        const successPayload = payload as DiscussionApiResponse;
        setThreads(successPayload.items);
        setSelectedThreadId((current) => {
          if (successPayload.focusThreadId) return successPayload.focusThreadId;
          if (current && successPayload.items.some((item) => item.id === current)) return current;
          return successPayload.items[0]?.id ?? "";
        });
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load discussion threads.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDiscussion();

    return () => controller.abort();
  }, [retryKey]);

  const isAdmin = session.role === "admin";

  const filteredThreads = useMemo(() => {

    const normalizedQuery = query.trim().toLowerCase();

    const matchingThreads = threads.filter((thread) => {
      if (!normalizedQuery) return true;
      const haystack = `${thread.title} ${thread.body} ${thread.authorName} ${thread.tag}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    return [...matchingThreads].sort((left, right) => {
      if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;

      if (sortMode === "popular") {
        return scoreThread(right) - scoreThread(left) || Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
      }

      if (sortMode === "needs-reply") {
        const leftNeedsReply = left.status === "needs-reply" ? 0 : 1;
        const rightNeedsReply = right.status === "needs-reply" ? 0 : 1;
        return leftNeedsReply - rightNeedsReply || Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
      }

      return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    });
  }, [query, sortMode, threads]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? filteredThreads[0] ?? null,
    [filteredThreads, selectedThreadId, threads],
  );

  const tagSummary = useMemo(() => {
    const counts = new Map<DiscussionTag, number>();

    threads.forEach((thread) => {
      counts.set(thread.tag, (counts.get(thread.tag) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([tagName, count]) => ({ tag: tagName, count }))
      .sort((left, right) => right.count - left.count);
  }, [threads]);

  const pinnedThreads = useMemo(() => threads.filter((thread) => thread.pinned), [threads]);

  function openToast(message: string) {
    setToastMessage(message);
    setToastOpen(true);
  }

  function applyDiscussionPayload(payload: DiscussionApiResponse) {
    setThreads(payload.items);
    setSelectedThreadId((current) => {
      if (payload.focusThreadId) return payload.focusThreadId;
      if (current && payload.items.some((item) => item.id === current)) return current;
      return payload.items[0]?.id ?? "";
    });
  }

  async function handleCreateThread() {
    setSubmittingThread(true);
    setComposerError(null);

    try {
      const requestBody: CreateDiscussionThreadRequest = {
        title,
        body,
        tag,
      };

      const response = await fetch("/api/discussion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const payload = (await response.json()) as DiscussionApiResponse | DiscussionErrorResponse;

      if (!response.ok || !("items" in payload)) {
        const errorPayload = payload as DiscussionErrorResponse;
        setComposerError(
          errorPayload.fieldErrors?.title ??
            errorPayload.fieldErrors?.body ??
            errorPayload.fieldErrors?.tag ??
            errorPayload.error,
        );
        openToast(errorPayload.error);
        return;
      }

      applyDiscussionPayload(payload as DiscussionApiResponse);
      setTitle("");
      setBody("");
      setTag("Operations");
      openToast("Discussion thread posted.");
    } catch {
      openToast("Unable to publish the discussion thread.");
    } finally {
      setSubmittingThread(false);
    }
  }

  async function handleReply() {
    if (!selectedThread) return;
    if (selectedThread.locked) {
      setReplyError("This thread is locked. Unlock it before posting a reply.");
      openToast("This thread is locked.");
      return;
    }

    setSubmittingReply(true);
    setReplyError(null);

    try {
      const requestBody: CreateDiscussionCommentRequest = { body: replyBody };
      const response = await fetch(`/api/discussion/${selectedThread.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const payload = (await response.json()) as DiscussionApiResponse | DiscussionErrorResponse;

      if (!response.ok || !("items" in payload)) {
        const errorPayload = payload as DiscussionErrorResponse;
        setReplyError(errorPayload.fieldErrors?.body ?? errorPayload.error);
        openToast(errorPayload.error);
        return;
      }

      applyDiscussionPayload(payload as DiscussionApiResponse);
      setReplyBody("");
      openToast("Reply added to thread.");
    } catch {
      openToast("Unable to post the reply.");
    } finally {
      setSubmittingReply(false);
    }
  }

  async function handleModeration(threadId: string, action: DiscussionModerationAction) {
    setModeratingAction(`${threadId}:${action}`);

    try {
      const response = await fetch(`/api/discussion/${threadId}/moderation`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as DiscussionApiResponse | DiscussionErrorResponse;

      if (!response.ok || !("items" in payload)) {
        openToast((payload as DiscussionErrorResponse).error);
        return;
      }

      applyDiscussionPayload(payload as DiscussionApiResponse);
      openToast("Discussion moderation updated.");
    } catch {
      openToast("Unable to update the discussion thread.");
    } finally {
      setModeratingAction(null);
    }
  }

  async function handleVote(threadId: string, direction: DiscussionVoteDirection) {
    setVotingThreadId(threadId);

    try {
      const requestBody: UpdateDiscussionVoteRequest = { direction };
      const response = await fetch(`/api/discussion/${threadId}/vote`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const payload = (await response.json()) as DiscussionApiResponse | DiscussionErrorResponse;

      if (!response.ok || !("items" in payload)) {
        openToast((payload as DiscussionErrorResponse).error);
        return;
      }

      applyDiscussionPayload(payload as DiscussionApiResponse);
    } catch {
      openToast("Unable to update the vote.");
    } finally {
      setVotingThreadId(null);
    }
  }

  const _timeTick = timeTick;

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          title="Discussion"
          description="A general thread hub for questions, decisions, and cross-team context before work moves into dedicated collaboration flows."
          actions={
            <Link
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              href="/collaboration"
            >
              Open Collaboration Tool
            </Link>
          }
        />

        {error ? (
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <p className="text-sm font-medium text-amber-900">Discussion refresh failed</p>
            <p className="mt-1 text-sm text-amber-800">{error}</p>
            <button
              className="mt-4 rounded-md border border-amber-300 bg-white px-3 py-2 text-sm text-amber-900 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
              onClick={() => setRetryKey((current) => current + 1)}
              type="button"
            >
              Retry
            </button>
          </Card>
        ) : null}

        <section aria-label="Discussion summary" className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-sm">
            <p className="text-sm font-medium text-gray-600">Active Threads</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">{threads.length}</p>
            <p className="mt-2 text-sm text-gray-600">General discussion feed.</p>
          </Card>
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
            <p className="text-sm font-medium text-gray-600">Needs Reply</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
              {threads.filter((thread) => thread.status === "needs-reply").length}
            </p>
            <p className="mt-2 text-sm text-gray-600">Threads waiting on an answer.</p>
          </Card>
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
            <p className="text-sm font-medium text-gray-600">Collaboration Handoffs</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
              {threads.filter((thread) => thread.collaborationSuggested).length}
            </p>
            <p className="mt-2 text-sm text-gray-600">Topics that likely need execution follow-up.</p>
          </Card>
        </section>

        <Card className="border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="discussion-title">
                  Start a new thread
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                  id="discussion-title"
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ask a question or start a discussion"
                  type="text"
                  value={title}
                />
              </div>
              <textarea
                className="min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                onChange={(event) => setBody(event.target.value)}
                placeholder="Describe the issue, context, proposal, or feedback."
                value={body}
              />
            </div>

            <div className="space-y-4">
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                onChange={(event) => setTag(event.target.value as DiscussionTag)}
                value={tag}
              >
                <option value="Operations">Operations</option>
                <option value="Support">Support</option>
                <option value="Integrations">Integrations</option>
                <option value="Security">Security</option>
              </select>
              <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                Use Discussion for shared context and decisions. Move work into Collaboration once a thread needs owners, tasks, or attachments.
              </p>
              {composerError ? <p className="text-sm text-red-600">{composerError}</p> : null}
              <button
                className="w-full rounded-md bg-gray-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
                disabled={submittingThread}
                onClick={() => void handleCreateThread()}
                type="button"
              >
                {submittingThread ? "Publishing..." : "Publish Thread"}
              </button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_300px]">
          <Card className="border-gray-200 bg-white shadow-sm">
            <header className="mb-4 space-y-3">
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search discussions"
                type="text"
                value={query}
              />
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => {
                  const active = option.value === sortMode;

                  return (
                    <button
                      key={option.value}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? "bg-gray-950 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setSortMode(option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </header>

            <div className="space-y-4">
              {!loading && filteredThreads.length === 0 ? (
                <EmptyState
                  title="No discussions match that search"
                  description="Try clearing the search or switching sort modes."
                  className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-14"
                />
              ) : null}

              {loading && threads.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                  Loading discussion threads...
                </div>
              ) : null}

              {filteredThreads.map((thread) => {
                const active = thread.id === selectedThread?.id;

                return (
                  <button
                    key={thread.id}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-sky-300 bg-sky-50/70 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedThreadId(thread.id)}
                    type="button"
                  >
                    <div className="flex gap-4">
                      <div className="flex min-w-[64px] flex-col items-center rounded-xl bg-gray-50 px-3 py-3 text-gray-700">
                        <span className="text-lg font-semibold text-gray-950">{thread.voteCount}</span>
                        <span className="text-[11px] uppercase tracking-wide text-gray-500">votes</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={tagVariant(thread.tag)}>{thread.tag}</Badge>
                          <Badge variant={statusMeta(thread.status).variant}>{statusMeta(thread.status).label}</Badge>
                          {thread.pinned ? <Badge variant="info">Pinned</Badge> : null}
                          {thread.locked ? <Badge variant="danger">Locked</Badge> : null}
                        </div>
                        <h2 className="mt-3 text-base font-semibold tracking-tight text-gray-950">
                          {thread.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-gray-600">{thread.excerpt}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>{thread.authorName}</span>
                          <span>{thread.replyCount} replies</span>
                          <span>{formatIsoAsAgo(thread.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            {selectedThread ? (
              <div className="space-y-6">
                <header className="space-y-4 border-b border-gray-100 pb-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={tagVariant(selectedThread.tag)}>{selectedThread.tag}</Badge>
                    <Badge variant={statusMeta(selectedThread.status).variant}>
                      {statusMeta(selectedThread.status).label}
                    </Badge>
                    {selectedThread.pinned ? <Badge variant="info">Pinned</Badge> : null}
                    {selectedThread.locked ? <Badge variant="danger">Locked</Badge> : null}
                    {selectedThread.collaborationSuggested ? (
                      <Badge variant="success">Open Collaboration if approved</Badge>
                    ) : null}
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-2xl font-semibold tracking-tight text-gray-950">
                        {selectedThread.title}
                      </h2>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white ${selectedThread.authorAvatarClass}`}>
                          {selectedThread.authorInitials}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedThread.authorName}</p>
                          <p className="text-xs text-gray-500">
                            {selectedThread.authorRole} · {formatIsoAsAgo(selectedThread.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      <button
                        aria-label="Upvote thread"
                        className={`rounded-md px-2 py-1 text-sm transition hover:bg-white ${selectedThread.currentUserVote === "up" ? "text-sky-700" : "text-gray-600 hover:text-gray-900"}`}
                        disabled={votingThreadId === selectedThread.id}
                        onClick={() => void handleVote(selectedThread.id, "up")}
                        type="button"
                      >
                        +
                      </button>
                      <span className="min-w-[3ch] text-center text-sm font-semibold text-gray-950">
                        {selectedThread.voteCount}
                      </span>
                      <button
                        aria-label="Downvote thread"
                        className={`rounded-md px-2 py-1 text-sm transition hover:bg-white ${selectedThread.currentUserVote === "down" ? "text-red-700" : "text-gray-600 hover:text-gray-900"}`}
                        disabled={votingThreadId === selectedThread.id}
                        onClick={() => void handleVote(selectedThread.id, "down")}
                        type="button"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </header>

                <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5">
                  <p className="text-sm leading-7 text-gray-700">{selectedThread.body}</p>
                </div>

                <section className="space-y-4">
                  {selectedThread.comments.map((comment) => (
                    <article key={comment.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white ${comment.authorAvatarClass}`}>
                          {comment.authorInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-gray-950">{comment.authorName}</p>
                            <span className="text-xs text-gray-500">{comment.authorRole}</span>
                            <span className="text-xs text-gray-500">{formatIsoAsAgo(comment.createdAt)}</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-gray-700">{comment.body}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>

                <section className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-5">
                  {selectedThread.locked ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      This thread is locked. {isAdmin ? "Unlock it from moderation to allow new replies." : "An admin needs to unlock it before new replies can be posted."}
                    </div>
                  ) : null}
                  <textarea
                    className="min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={selectedThread.locked}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Share a recommendation, ask a follow-up, or move the thread toward a decision."
                    value={replyBody}
                  />
                  {replyError ? <p className="mt-2 text-sm text-red-600">{replyError}</p> : null}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">
                      Keep the thread focused on decisions and shared context.
                    </p>
                    <button
                      className="rounded-md bg-gray-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
                      disabled={submittingReply || selectedThread.locked}
                      onClick={() => void handleReply()}
                      type="button"
                    >
                      {submittingReply ? "Posting..." : selectedThread.locked ? "Thread Locked" : "Post Reply"}
                    </button>
                  </div>
                </section>
              </div>
            ) : (
              <EmptyState
                title="Pick a thread to read the discussion"
                description="Select a thread from the feed to inspect the full post and replies."
                className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16"
              />
            )}
          </Card>

          <div className="space-y-6">
            <Card className="border-gray-200 bg-white shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight text-gray-950">Collaboration is the execution tool</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Use Discussion to align on questions and decisions. Use Collaboration when a thread needs owners, tasks, attachments, or board-style follow-through.
              </p>
              <Link
                className="mt-5 inline-flex rounded-md bg-gray-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                href="/collaboration"
              >
                Open Collaboration
              </Link>
            </Card>

            <Card className="border-gray-200 bg-white shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight text-gray-950">Pinned Topics</h2>
              <div className="mt-4 space-y-3">
                {pinnedThreads.length > 0 ? (
                  pinnedThreads.map((thread) => (
                    <button
                      key={thread.id}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-left transition hover:border-gray-300 hover:bg-white"
                      onClick={() => setSelectedThreadId(thread.id)}
                      type="button"
                    >
                      <p className="text-sm font-medium text-gray-950">{thread.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatIsoAsAgo(thread.updatedAt)}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No pinned topics yet.</p>
                )}
              </div>
            </Card>

            <Card className="border-gray-200 bg-white shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight text-gray-950">Trending Tags</h2>
              <div className="mt-4 space-y-3">
                {tagSummary.map((item) => (
                  <div key={item.tag} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <Badge variant={tagVariant(item.tag)}>{item.tag}</Badge>
                    <span className="text-sm font-medium text-gray-700">{item.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Toast open={toastOpen} message={toastMessage} />
    </>
  );
}









