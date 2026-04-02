import type { PublicUser } from "@/types";
import type {
  DiscussionApiResponse,
  DiscussionComment,
  DiscussionThread,
  StoredDiscussionComment,
  StoredDiscussionThread,
  StoredDiscussionVote,
} from "@/types";
import { FileDiscussionRepository } from "./file-discussion-repository";

function buildInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function buildDiscussionAuthor(user: Pick<PublicUser, "fullName" | "role">) {
  return {
    name: user.fullName,
    role: user.role === "admin" ? "Admin" : "Agent",
    initials: buildInitials(user.fullName),
    avatarClass: user.role === "admin" ? "from-indigo-500 to-sky-600" : "from-emerald-400 to-teal-600",
  };
}

function toDiscussionComment(comment: StoredDiscussionComment): DiscussionComment {
  return {
    id: comment.id,
    threadId: comment.threadId,
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    authorInitials: comment.authorInitials,
    authorAvatarClass: comment.authorAvatarClass,
    body: comment.body,
    createdAt: comment.createdAt,
  };
}

function computeVoteCount(thread: StoredDiscussionThread, votes: StoredDiscussionVote[]) {
  return thread.baseVoteCount + votes.reduce((sum, vote) => sum + (vote.direction === "up" ? 1 : -1), 0);
}

function buildDiscussionThread(
  thread: StoredDiscussionThread,
  comments: StoredDiscussionComment[],
  votes: StoredDiscussionVote[],
  currentUserId: string,
): DiscussionThread {
  const threadComments = comments
    .filter((comment) => comment.threadId === thread.id)
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
  const threadVotes = votes.filter((vote) => vote.threadId === thread.id);
  const latestCommentAt = threadComments[threadComments.length - 1]?.createdAt;
  const updatedAt = latestCommentAt && Date.parse(latestCommentAt) > Date.parse(thread.updatedAt)
    ? latestCommentAt
    : thread.updatedAt;

  return {
    id: thread.id,
    title: thread.title,
    excerpt: thread.excerpt,
    body: thread.body,
    tag: thread.tag,
    authorName: thread.authorName,
    authorRole: thread.authorRole,
    authorInitials: thread.authorInitials,
    authorAvatarClass: thread.authorAvatarClass,
    createdAt: thread.createdAt,
    updatedAt,
    voteCount: computeVoteCount(thread, threadVotes),
    replyCount: threadComments.length,
    status: thread.status,
    pinned: thread.pinned,
    locked: thread.locked,
    collaborationSuggested: thread.collaborationSuggested,
    currentUserVote: threadVotes.find((vote) => vote.userId === currentUserId)?.direction ?? null,
    comments: threadComments.map(toDiscussionComment),
  };
}

export async function buildDiscussionPayload(currentUserId: string, focusThreadId?: string): Promise<DiscussionApiResponse> {
  const repository = new FileDiscussionRepository();
  const [threads, comments, votes] = await Promise.all([
    repository.listThreads(),
    repository.listComments(),
    repository.listVotes(),
  ]);

  const items = threads
    .map((thread) => buildDiscussionThread(thread, comments, votes, currentUserId))
    .sort((left, right) => {
      if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
      return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    });

  return {
    generatedAt: new Date().toISOString(),
    items,
    focusThreadId,
  };
}
