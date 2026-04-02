import type {
  SupportRecordErrorResponse,
  SupportRecordInput,
  SupportRecordPriority,
  SupportRecordStatus,
} from "@/types";

const validChannels = new Set(["Web Chat", "Email", "SMS"]);
const validCategories = new Set(["Delivery", "Returns", "Billing", "Account"]);
const validStatuses = new Set<SupportRecordStatus>([
  "Open",
  "In Progress",
  "Resolved",
  "Escalated",
]);
const validPriorities = new Set<SupportRecordPriority>(["High", "Medium", "Low"]);

type ValidationSuccess = {
  success: true;
  data: SupportRecordInput;
};

type ValidationFailure = {
  success: false;
  error: SupportRecordErrorResponse;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOccurredAt(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;

  const candidate =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text) || /^\d{4}-\d{2}-\d{2}$/.test(text)
      ? new Date(text)
      : new Date(text);

  if (Number.isNaN(candidate.getTime())) return null;
  return candidate.toISOString();
}

function parseNonNegativeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number.NaN;
}

export function validateSupportRecordInput(value: unknown): ValidationSuccess | ValidationFailure {
  if (!value || typeof value !== "object") {
    return {
      success: false,
      error: { error: "Support record details are required." },
    };
  }

  const sourceName = normalizeText((value as Record<string, unknown>).sourceName);
  const occurredAt = normalizeOccurredAt((value as Record<string, unknown>).occurredAt);
  const customer = normalizeText((value as Record<string, unknown>).customer);
  const channel = normalizeText((value as Record<string, unknown>).channel);
  const category = normalizeText((value as Record<string, unknown>).category);
  const subject = normalizeText((value as Record<string, unknown>).subject);
  const status = normalizeText((value as Record<string, unknown>).status) as SupportRecordStatus;
  const priority = normalizeText(
    (value as Record<string, unknown>).priority,
  ) as SupportRecordPriority;
  const responseMinutes = parseNonNegativeNumber(
    (value as Record<string, unknown>).responseMinutes,
  );
  const notes = normalizeText((value as Record<string, unknown>).notes);

  const fieldErrors: SupportRecordErrorResponse["fieldErrors"] = {};

  if (sourceName.length < 2) {
    fieldErrors.sourceName = "Enter a source name.";
  }

  if (!occurredAt) {
    fieldErrors.occurredAt = "Enter a valid date and time.";
  }

  if (customer.length < 2) {
    fieldErrors.customer = "Enter a customer name.";
  }

  if (!validChannels.has(channel)) {
    fieldErrors.channel = "Choose a valid support channel.";
  }

  if (!validCategories.has(category)) {
    fieldErrors.category = "Choose a valid category.";
  }

  if (subject.length < 3) {
    fieldErrors.subject = "Enter a short issue summary.";
  }

  if (!validStatuses.has(status)) {
    fieldErrors.status = "Choose a valid status.";
  }

  if (!validPriorities.has(priority)) {
    fieldErrors.priority = "Choose a valid priority.";
  }

  if (!Number.isFinite(responseMinutes) || responseMinutes < 0) {
    fieldErrors.responseMinutes = "Response minutes must be zero or greater.";
  }

  if (notes.length > 280) {
    fieldErrors.notes = "Keep notes under 280 characters.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: {
        error: "Please fix the highlighted support record fields.",
        fieldErrors,
      },
    };
  }

  return {
    success: true,
    data: {
      sourceName,
      occurredAt: occurredAt!,
      customer,
      channel: channel as SupportRecordInput["channel"],
      category: category as SupportRecordInput["category"],
      subject,
      status,
      priority,
      responseMinutes,
      notes,
    },
  };
}
