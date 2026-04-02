import { randomUUID } from "node:crypto";
import {
  ensureAuthDatabaseSchema,
  getAuthDatabase,
} from "@/lib/auth/database";
import type {
  DiscussionModerationAction,
  DiscussionTag,
  DiscussionThreadStatus,
  DiscussionVoteDirection,
  StoredDiscussionComment,
  StoredDiscussionThread,
  StoredDiscussionVote,
} from "@/types/discussion";
import {
  defaultDiscussionComments,
  defaultDiscussionThreads,
} from "./default-discussion-data";
import type { DiscussionAuthor, DiscussionRepository } from "./repository";

type DiscussionThreadRow = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  tag: DiscussionTag;
  author_name: string;
  author_role: string;
  author_initials: string;
  author_avatar_class: string;
  created_at: string;
  updated_at: string;
  status: DiscussionThreadStatus;
  pinned: boolean;
  locked: boolean;
  collaboration_suggested: boolean;
  base_vote_count: number;
};

type DiscussionCommentRow = {
  id: string;
  thread_id: string;
  author_name: string;
  author_role: string;
  author_initials: string;
  author_avatar_class: string;
  body: string;
  created_at: string;
};

type DiscussionVoteRow = {
  thread_id: string;
  user_id: string;
  direction: DiscussionVoteDirection;
  updated_at: string;
};

let discussionSchemaReadyPromise: Promise<void> | null = null;

function toStoredThread(row: DiscussionThreadRow): StoredDiscussionThread {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    tag: row.tag,
    authorName: row.author_name,
    authorRole: row.author_role,
    authorInitials: row.author_initials,
    authorAvatarClass: row.author_avatar_class,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    pinned: row.pinned,
    locked: row.locked,
    collaborationSuggested: row.collaboration_suggested,
    baseVoteCount: row.base_vote_count,
  };
}

function toStoredComment(row: DiscussionCommentRow): StoredDiscussionComment {
  return {
    id: row.id,
    threadId: row.thread_id,
    authorName: row.author_name,
    authorRole: row.author_role,
    authorInitials: row.author_initials,
    authorAvatarClass: row.author_avatar_class,
    body: row.body,
    createdAt: row.created_at,
  };
}

function toStoredVote(row: DiscussionVoteRow): StoredDiscussionVote {
  return {
    threadId: row.thread_id,
    userId: row.user_id,
    direction: row.direction,
    updatedAt: row.updated_at,
  };
}

async function seedDefaultDiscussionData() {
  const sql = getAuthDatabase();
  const [threadCountRow] = (await sql`
    SELECT COUNT(*)::int AS count
    FROM discussion_threads
  `) as Array<{ count: number }>;

  if ((threadCountRow?.count ?? 0) > 0) {
    return;
  }

  for (const thread of defaultDiscussionThreads) {
    await sql`
      INSERT INTO discussion_threads (
        id,
        title,
        excerpt,
        body,
        tag,
        author_name,
        author_role,
        author_initials,
        author_avatar_class,
        created_at,
        updated_at,
        status,
        pinned,
        locked,
        collaboration_suggested,
        base_vote_count
      )
      VALUES (
        ${thread.id},
        ${thread.title},
        ${thread.excerpt},
        ${thread.body},
        ${thread.tag},
        ${thread.authorName},
        ${thread.authorRole},
        ${thread.authorInitials},
        ${thread.authorAvatarClass},
        ${thread.createdAt},
        ${thread.updatedAt},
        ${thread.status},
        ${thread.pinned},
        ${thread.locked},
        ${thread.collaborationSuggested},
        ${thread.baseVoteCount}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  for (const comment of defaultDiscussionComments) {
    await sql`
      INSERT INTO discussion_comments (
        id,
        thread_id,
        author_name,
        author_role,
        author_initials,
        author_avatar_class,
        body,
        created_at
      )
      VALUES (
        ${comment.id},
        ${comment.threadId},
        ${comment.authorName},
        ${comment.authorRole},
        ${comment.authorInitials},
        ${comment.authorAvatarClass},
        ${comment.body},
        ${comment.createdAt}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function ensureDiscussionDatabaseSchema() {
  await ensureAuthDatabaseSchema();

  if (!discussionSchemaReadyPromise) {
    discussionSchemaReadyPromise = (async () => {
      const sql = getAuthDatabase();

      await sql`
        CREATE TABLE IF NOT EXISTS discussion_threads (
          id text PRIMARY KEY,
          title text NOT NULL,
          excerpt text NOT NULL,
          body text NOT NULL,
          tag text NOT NULL,
          author_name text NOT NULL,
          author_role text NOT NULL,
          author_initials text NOT NULL,
          author_avatar_class text NOT NULL,
          created_at text NOT NULL,
          updated_at text NOT NULL,
          status text NOT NULL,
          pinned boolean NOT NULL,
          locked boolean NOT NULL,
          collaboration_suggested boolean NOT NULL,
          base_vote_count integer NOT NULL
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS discussion_comments (
          id text PRIMARY KEY,
          thread_id text NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
          author_name text NOT NULL,
          author_role text NOT NULL,
          author_initials text NOT NULL,
          author_avatar_class text NOT NULL,
          body text NOT NULL,
          created_at text NOT NULL
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS discussion_comments_thread_id_idx
        ON discussion_comments (thread_id)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS discussion_votes (
          user_id text NOT NULL,
          thread_id text NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
          direction text NOT NULL,
          updated_at text NOT NULL,
          PRIMARY KEY (user_id, thread_id)
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS discussion_votes_thread_id_idx
        ON discussion_votes (thread_id)
      `;

      await seedDefaultDiscussionData();
    })().catch((error) => {
      discussionSchemaReadyPromise = null;
      throw error;
    });
  }

  await discussionSchemaReadyPromise;
}

export class DbDiscussionRepository implements DiscussionRepository {
  async listThreads() {
    await ensureDiscussionDatabaseSchema();
    const sql = getAuthDatabase();
    const rows = (await sql`
      SELECT
        id,
        title,
        excerpt,
        body,
        tag,
        author_name,
        author_role,
        author_initials,
        author_avatar_class,
        created_at,
        updated_at,
        status,
        pinned,
        locked,
        collaboration_suggested,
        base_vote_count
      FROM discussion_threads
    `) as DiscussionThreadRow[];

    return rows.map(toStoredThread);
  }

  async listComments() {
    await ensureDiscussionDatabaseSchema();
    const sql = getAuthDatabase();
    const rows = (await sql`
      SELECT
        id,
        thread_id,
        author_name,
        author_role,
        author_initials,
        author_avatar_class,
        body,
        created_at
      FROM discussion_comments
    `) as DiscussionCommentRow[];

    return rows.map(toStoredComment);
  }

  async listVotes() {
    await ensureDiscussionDatabaseSchema();
    const sql = getAuthDatabase();
    const rows = (await sql`
      SELECT
        thread_id,
        user_id,
        direction,
        updated_at
      FROM discussion_votes
    `) as DiscussionVoteRow[];

    return rows.map(toStoredVote);
  }

  async findThreadById(threadId: string) {
    await ensureDiscussionDatabaseSchema();
    const sql = getAuthDatabase();
    const [row] = (await sql`
      SELECT
        id,
        title,
        excerpt,
        body,
        tag,
        author_name,
        author_role,
        author_initials,
        author_avatar_class,
        created_at,
        updated_at,
        status,
        pinned,
        locked,
        collaboration_suggested,
        base_vote_count
      FROM discussion_threads
      WHERE id = ${threadId}
      LIMIT 1
    `) as DiscussionThreadRow[];

    return row ? toStoredThread(row) : null;
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
    await ensureDiscussionDatabaseSchema();
    const sql = getAuthDatabase();
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

    await sql`
      INSERT INTO discussion_threads (
        id,
        title,
        excerpt,
        body,
        tag,
        author_name,
        author_role,
        author_initials,
        author_avatar_class,
        created_at,
        updated_at,
        status,
        pinned,
        locked,
        collaboration_suggested,
        base_vote_count
      )
      VALUES (
        ${thread.id},
        ${thread.title},
        ${thread.excerpt},
        ${thread.body},
        ${thread.tag},
        ${thread.authorName},
        ${thread.authorRole},
        ${thread.authorInitials},
        ${thread.authorAvatarClass},
        ${thread.createdAt},
        ${thread.updatedAt},
        ${thread.status},
        ${thread.pinned},
        ${thread.locked},
        ${thread.collaborationSuggested},
        ${thread.baseVoteCount}
      )
    `;

    return thread;
  }

  async createComment(threadId: string, input: { body: string; author: DiscussionAuthor }) {
    await ensureDiscussionDatabaseSchema();
    const existingThread = await this.findThreadById(threadId);
    if (!existingThread) {
      throw new Error("DISCUSSION_THREAD_NOT_FOUND");
    }

    if (existingThread.locked) {
      throw new Error("DISCUSSION_THREAD_LOCKED");
    }

    const sql = getAuthDatabase();
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

    await sql`
      INSERT INTO discussion_comments (
        id,
        thread_id,
        author_name,
        author_role,
        author_initials,
        author_avatar_class,
        body,
        created_at
      )
      VALUES (
        ${comment.id},
        ${comment.threadId},
        ${comment.authorName},
        ${comment.authorRole},
        ${comment.authorInitials},
        ${comment.authorAvatarClass},
        ${comment.body},
        ${comment.createdAt}
      )
    `;

    await sql`
      UPDATE discussion_threads
      SET
        updated_at = ${nowIso},
        status = ${"active"}
      WHERE id = ${threadId}
    `;

    return comment;
  }

  async moderateThread(threadId: string, action: DiscussionModerationAction) {
    await ensureDiscussionDatabaseSchema();
    const existingThread = await this.findThreadById(threadId);
    if (!existingThread) {
      return null;
    }

    const sql = getAuthDatabase();
    const updatedThread: StoredDiscussionThread = {
      ...existingThread,
      pinned: action === "toggle-pin" ? !existingThread.pinned : existingThread.pinned,
      locked: action === "toggle-lock" ? !existingThread.locked : existingThread.locked,
      status:
        action === "mark-resolved"
          ? "resolved"
          : action === "mark-active"
            ? "active"
            : existingThread.status,
      updatedAt: new Date().toISOString(),
    };

    await sql`
      UPDATE discussion_threads
      SET
        pinned = ${updatedThread.pinned},
        locked = ${updatedThread.locked},
        status = ${updatedThread.status},
        updated_at = ${updatedThread.updatedAt}
      WHERE id = ${threadId}
    `;

    return updatedThread;
  }

  async setVote(
    userId: string,
    threadId: string,
    direction: DiscussionVoteDirection,
    toggleSame = true,
  ) {
    await ensureDiscussionDatabaseSchema();
    const sql = getAuthDatabase();
    const [existingVote] = (await sql`
      SELECT
        thread_id,
        user_id,
        direction,
        updated_at
      FROM discussion_votes
      WHERE user_id = ${userId} AND thread_id = ${threadId}
      LIMIT 1
    `) as DiscussionVoteRow[];

    if (toggleSame && existingVote?.direction === direction) {
      await sql`
        DELETE FROM discussion_votes
        WHERE user_id = ${userId} AND thread_id = ${threadId}
      `;
      return null;
    }

    const nowIso = new Date().toISOString();
    await sql`
      INSERT INTO discussion_votes (user_id, thread_id, direction, updated_at)
      VALUES (${userId}, ${threadId}, ${direction}, ${nowIso})
      ON CONFLICT (user_id, thread_id)
      DO UPDATE SET
        direction = EXCLUDED.direction,
        updated_at = EXCLUDED.updated_at
    `;

    return direction;
  }
}
