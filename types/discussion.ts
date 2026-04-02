export type DiscussionTag = "Operations" | "Support" | "Integrations" | "Security";

export type DiscussionThreadStatus = "active" | "needs-reply" | "resolved";

export type DiscussionVoteDirection = "up" | "down";

export type DiscussionModerationAction =
  | "toggle-pin"
  | "toggle-lock"
  | "mark-resolved"
  | "mark-active";

export type DiscussionComment = {
  id: string;
  threadId: string;
  authorName: string;
  authorRole: string;
  authorInitials: string;
  authorAvatarClass: string;
  body: string;
  createdAt: string;
};

export type DiscussionThread = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  tag: DiscussionTag;
  authorName: string;
  authorRole: string;
  authorInitials: string;
  authorAvatarClass: string;
  createdAt: string;
  updatedAt: string;
  voteCount: number;
  replyCount: number;
  status: DiscussionThreadStatus;
  pinned: boolean;
  locked: boolean;
  collaborationSuggested: boolean;
  currentUserVote: DiscussionVoteDirection | null;
  comments: DiscussionComment[];
};

export type StoredDiscussionThread = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  tag: DiscussionTag;
  authorName: string;
  authorRole: string;
  authorInitials: string;
  authorAvatarClass: string;
  createdAt: string;
  updatedAt: string;
  status: DiscussionThreadStatus;
  pinned: boolean;
  locked: boolean;
  collaborationSuggested: boolean;
  baseVoteCount: number;
};

export type StoredDiscussionComment = {
  id: string;
  threadId: string;
  authorName: string;
  authorRole: string;
  authorInitials: string;
  authorAvatarClass: string;
  body: string;
  createdAt: string;
};

export type StoredDiscussionVote = {
  threadId: string;
  userId: string;
  direction: DiscussionVoteDirection;
  updatedAt: string;
};
