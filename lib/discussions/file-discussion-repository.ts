import { randomUUID } from "node:crypto";
import { authConfig } from "@/lib/auth/config";
import { mutateJsonFile, readJsonFile } from "@/lib/auth/file-store";
import type {
  DiscussionVoteDirection,
  StoredDiscussionVote,
} from "@/types/discussion";
import type { DiscussionRepository } from "./repository";
import type { DiscussionAuthor } from "./repository";
import { defaultDiscussionComments, defaultDiscussionThreads } from "./default-discussion-data";
import type {
  DiscussionModerationAction,
  DiscussionTag,
  DiscussionThreadStatus,
  StoredDiscussionComment,
  StoredDiscussionThread,
} from "@/types/discussion";

const defaultStoredThreads: StoredDiscussionThread[] = [];
const defaultStoredComments: StoredDiscussionComment[] = [];
const defaultStoredVotes: StoredDiscussionVote[] = [];

export class FileDiscussionRepository implements DiscussionRepository {
  constructor(
    private readonly threadsFilePath = authConfig.discussionThreadsFilePath,
    private readonly commentsFilePath = authConfig.discussionCommentsFilePath,
    private readonly votesFilePath = authConfig.discussionVotesFilePath,
  ) {}

  private getThreadBaseline(currentItems: StoredDiscussionThread[]) {
    return currentItems.length > 0 ? currentItems : defaultDiscussionThreads;
  }

  private getCommentBaseline(currentItems: StoredDiscussionComment[]) {
    return currentItems.length > 0 ? currentItems : defaultDiscussionComments;
  }

  async listThreads() {
    const threads = await readJsonFile(this.threadsFilePath, defaultStoredThreads);
    return this.getThreadBaseline(threads);
  }

  async listComments() {
    const comments = await readJsonFile(this.commentsFilePath, defaultStoredComments);
    return this.getCommentBaseline(comments);
  }

  async listVotes() {
    return readJsonFile(this.votesFilePath, defaultStoredVotes);
  }

  async findThreadById(threadId: string) {
    const threads = await this.listThreads();
    return threads.find((thread) => thread.id === threadId) ?? null;
  }

  async createThread(input: {
    title: string;
    body: string;
    excerpt: string;
    tag: DiscussionTag;
    author: DiscussionAuthor;
    status?: DiscussionThreadStatus;
    collaborationSuggested?: boolean;
  }) {
    const nowIso = new Date().toISOString();
    const thread: StoredDiscussionThread = {
      id: randomUUID(),
      title: input.title,
      excerpt: input.excerpt,
      body: input.body,
      tag: input.tag,
      authorName: input.author.name,
      authorRole: input.author.role,
      authorInitials: input.author.initials,
      authorAvatarClass: input.author.avatarClass,
      createdAt: nowIso,
      updatedAt: nowIso,
      status: input.status ?? "needs-reply",
      pinned: false,
      locked: false,
      collaborationSuggested: input.collaborationSuggested ?? false,
      baseVoteCount: 0,
    };

    await mutateJsonFile(this.threadsFilePath, defaultStoredThreads, (currentItems) => [
      thread,
      ...this.getThreadBaseline(currentItems),
    ]);
    return thread;
  }

  async createComment(threadId: string, input: { body: string; author: DiscussionAuthor }) {
    const existingThread = await this.findThreadById(threadId);
    if (!existingThread) {
      throw new Error("DISCUSSION_THREAD_NOT_FOUND");
    }

    if (existingThread.locked) {
      throw new Error("DISCUSSION_THREAD_LOCKED");
    }

    const nowIso = new Date().toISOString();
    const comment: StoredDiscussionComment = {
      id: randomUUID(),
      threadId,
      authorName: input.author.name,
      authorRole: input.author.role,
      authorInitials: input.author.initials,
      authorAvatarClass: input.author.avatarClass,
      body: input.body,
      createdAt: nowIso,
    };

    await mutateJsonFile(this.commentsFilePath, defaultStoredComments, (currentItems) => [
      ...this.getCommentBaseline(currentItems),
      comment,
    ]);

    await mutateJsonFile(this.threadsFilePath, defaultStoredThreads, (currentItems) =>
      this.getThreadBaseline(currentItems).map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              updatedAt: nowIso,
              status: "active",
            }
          : thread,
      ),
    );

    return comment;
  }

  async moderateThread(threadId: string, action: DiscussionModerationAction) {
    let updatedThread: StoredDiscussionThread | null = null;
    const nowIso = new Date().toISOString();

    await mutateJsonFile(this.threadsFilePath, defaultStoredThreads, (currentItems) => {
      const baselineItems = this.getThreadBaseline(currentItems);
      const existingThread = baselineItems.find((thread) => thread.id === threadId);
      if (!existingThread) {
        return baselineItems;
      }

      updatedThread = {
        ...existingThread,
        pinned: action === "toggle-pin" ? !existingThread.pinned : existingThread.pinned,
        locked: action === "toggle-lock" ? !existingThread.locked : existingThread.locked,
        status:
          action === "mark-resolved"
            ? "resolved"
            : action === "mark-active"
              ? "active"
              : existingThread.status,
        updatedAt: nowIso,
      };

      return baselineItems.map((thread) => (thread.id === threadId ? updatedThread! : thread));
    });

    return updatedThread;
  }

  async setVote(userId: string, threadId: string, direction: DiscussionVoteDirection, toggleSame = true) {
    let nextDirection: DiscussionVoteDirection | null = direction;
    const nowIso = new Date().toISOString();

    await mutateJsonFile(this.votesFilePath, defaultStoredVotes, (currentItems) => {
      const existing = currentItems.find((item) => item.userId === userId && item.threadId === threadId);

      if (!existing) {
        return [
          ...currentItems,
          {
            userId,
            threadId,
            direction,
            updatedAt: nowIso,
          },
        ];
      }

      if (toggleSame && existing.direction === direction) {
        nextDirection = null;
        return currentItems.filter((item) => !(item.userId === userId && item.threadId === threadId));
      }

      nextDirection = direction;
      return currentItems.map((item) =>
        item.userId === userId && item.threadId === threadId
          ? { ...item, direction, updatedAt: nowIso }
          : item,
      );
    });

    return nextDirection;
  }
}
