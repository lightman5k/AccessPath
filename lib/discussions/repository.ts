import type {
  DiscussionModerationAction,
  DiscussionTag,
  DiscussionThreadStatus,
  DiscussionVoteDirection,
  StoredDiscussionComment,
  StoredDiscussionThread,
  StoredDiscussionVote,
} from "@/types/discussion";

export type DiscussionAuthor = {
  name: string;
  role: string;
  initials: string;
  avatarClass: string;
};

export interface DiscussionRepository {
  listThreads(): Promise<StoredDiscussionThread[]>;
  listComments(): Promise<StoredDiscussionComment[]>;
  listVotes(): Promise<StoredDiscussionVote[]>;
  findThreadById(threadId: string): Promise<StoredDiscussionThread | null>;
  createThread(input: {
    title: string;
    body: string;
    excerpt: string;
    tag: DiscussionTag;
    author: DiscussionAuthor;
    status?: DiscussionThreadStatus;
    collaborationSuggested?: boolean;
  }): Promise<StoredDiscussionThread>;
  createComment(
    threadId: string,
    input: { body: string; author: DiscussionAuthor },
  ): Promise<StoredDiscussionComment>;
  moderateThread(
    threadId: string,
    action: DiscussionModerationAction,
  ): Promise<StoredDiscussionThread | null>;
  setVote(
    userId: string,
    threadId: string,
    direction: DiscussionVoteDirection,
    toggleSame?: boolean,
  ): Promise<DiscussionVoteDirection | null>;
}
