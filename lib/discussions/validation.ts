import type {
  CreateDiscussionCommentRequest,
  CreateDiscussionThreadRequest,
  DiscussionErrorResponse,
  DiscussionTag,
  DiscussionVoteDirection,
  UpdateDiscussionVoteRequest,
} from "@/types";
import type { DiscussionModerationAction } from "@/types/discussion";

const validTags = new Set<DiscussionTag>(["Operations", "Support", "Integrations", "Security"]);
const validDirections = new Set<DiscussionVoteDirection>(["up", "down"]);
const validModerationActions = new Set<DiscussionModerationAction>([
  "toggle-pin",
  "toggle-lock",
  "mark-resolved",
  "mark-active",
]);

type ThreadValidationSuccess = {
  success: true;
  data: CreateDiscussionThreadRequest;
};

type CommentValidationSuccess = {
  success: true;
  data: CreateDiscussionCommentRequest;
};

type VoteValidationSuccess = {
  success: true;
  data: UpdateDiscussionVoteRequest;
};

type ModerationValidationSuccess = {
  success: true;
  data: { action: DiscussionModerationAction };
};

type ValidationFailure = {
  success: false;
  error: DiscussionErrorResponse;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateCreateDiscussionThread(value: unknown): ThreadValidationSuccess | ValidationFailure {
  if (!value || typeof value !== "object") {
    return { success: false, error: { error: "Discussion thread details are required." } };
  }

  const title = normalizeText((value as Record<string, unknown>).title);
  const body = normalizeText((value as Record<string, unknown>).body);
  const tag = normalizeText((value as Record<string, unknown>).tag) as DiscussionTag;
  const fieldErrors: DiscussionErrorResponse["fieldErrors"] = {};

  if (title.length < 5) {
    fieldErrors.title = "Add a thread title with at least 5 characters.";
  }

  if (title.length > 140) {
    fieldErrors.title = "Keep the title under 140 characters.";
  }

  if (body.length < 12) {
    fieldErrors.body = "Add more context before publishing the thread.";
  }

  if (body.length > 2000) {
    fieldErrors.body = "Keep the opening post under 2000 characters.";
  }

  if (!validTags.has(tag)) {
    fieldErrors.tag = "Choose a valid discussion topic.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: {
        error: "Please fix the highlighted discussion fields.",
        fieldErrors,
      },
    };
  }

  return {
    success: true,
    data: { title, body, tag },
  };
}

export function validateCreateDiscussionComment(value: unknown): CommentValidationSuccess | ValidationFailure {
  if (!value || typeof value !== "object") {
    return { success: false, error: { error: "Reply details are required." } };
  }

  const body = normalizeText((value as Record<string, unknown>).body);
  if (body.length < 2) {
    return {
      success: false,
      error: {
        error: "Write a reply before posting.",
        fieldErrors: { body: "Write a reply before posting." },
      },
    };
  }

  if (body.length > 1500) {
    return {
      success: false,
      error: {
        error: "Keep the reply under 1500 characters.",
        fieldErrors: { body: "Keep the reply under 1500 characters." },
      },
    };
  }

  return {
    success: true,
    data: { body },
  };
}

export function validateDiscussionVote(value: unknown): VoteValidationSuccess | ValidationFailure {
  if (!value || typeof value !== "object") {
    return { success: false, error: { error: "Vote direction is required." } };
  }

  const direction = normalizeText((value as Record<string, unknown>).direction) as DiscussionVoteDirection;
  if (!validDirections.has(direction)) {
    return {
      success: false,
      error: {
        error: "Choose a valid vote direction.",
        fieldErrors: { direction: "Choose a valid vote direction." },
      },
    };
  }

  return {
    success: true,
    data: { direction },
  };
}

export function validateDiscussionModeration(value: unknown): ModerationValidationSuccess | ValidationFailure {
  if (!value || typeof value !== "object") {
    return { success: false, error: { error: "Moderation action is required." } };
  }

  const action = normalizeText((value as Record<string, unknown>).action) as DiscussionModerationAction;
  if (!validModerationActions.has(action)) {
    return {
      success: false,
      error: {
        error: "Choose a valid moderation action.",
      },
    };
  }

  return {
    success: true,
    data: { action },
  };
}
