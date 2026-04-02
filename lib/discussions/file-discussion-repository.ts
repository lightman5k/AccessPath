import { randomUUID } from "node:crypto";
import { authConfig } from "@/lib/auth/config";
import { mutateJsonFile, readJsonFile } from "@/lib/auth/file-store";
import type {
  DiscussionModerationAction,
  DiscussionTag,
  DiscussionThreadStatus,
  DiscussionVoteDirection,
  StoredDiscussionComment,
  StoredDiscussionThread,
  StoredDiscussionVote,
} from "@/types/discussion";
import { defaultDiscussionComments, defaultDiscussionThreads } from "./default-discussion-data";

const defaultStoredThreads: StoredDiscussionThread[] = [];
const defaultStoredComments: StoredDiscussionComment[] = [];
const defaultStoredVotes: StoredDiscussionVote[] = [];

type DiscussionAuthor = {
  name: string;
  role: string;
  initials: string;
  avatarClass: string;
};

export class FileDiscussionRepository {
  constructor(
    private readonly threadsFilePath = authConfig.discussionThreadsFilePath,
    private readonly commentsFilePath = authConfig.discussionCommentsFilePath,
    private readonly votesFilePath = authConfig.discussionVotesFilePath,
  ) {}

  private async ensureSeedData() {
    const [threads, comments] = await Promise.all([
      readJsonFile(this.threadsFilePath, defaultStoredThreads),
      readJsonFile(this.commentsFilePath, defaultStoredComments),
    ]);

    if (threads.length === 0) {
      await mutateJsonFile(this.threadsFilePath, defaultStoredThreads, () => defaultDiscussionThreads);
    }

    if (comments.length === 0) {
      await mutateJsonFile(this.commentsFilePath, defaultStoredComments, () => defaultDiscussionComments);
    }
  }

  async listThreads() {
    await this.ensureSeedData();
    return readJsonFile(this.threadsFilePath, defaultStoredThreads);
  }

  async listComments() {
    await this.ensureSeedData();
    return readJsonFile(this.commentsFilePath, defaultStoredComments);
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

    await mutateJsonFile(this.threadsFilePath, defaultStoredThreads, (currentItems) => [thread, ...currentItems]);
    return thread;
  }

  async createComment(threadId: string, input: { body: string; author: DiscussionAuthor }) {
    await this.ensureSeedData();
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
      ...currentItems,
      comment,
    ]);

    await mutateJsonFile(this.threadsFilePath, defaultStoredThreads, (currentItems) =>
      currentItems.map((thread) =>
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
      const existingThread = currentItems.find((thread) => thread.id === threadId);
      if (!existingThread) {
        return currentItems;
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

      return currentItems.map((thread) => (thread.id === threadId ? updatedThread! : thread));
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
