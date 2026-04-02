import type { SettingsErrorResponse, SettingsState } from "@/types";

export type ValidatedSettingsInput = SettingsState & {
  emailNormalized: string;
};

type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: SettingsErrorResponse;
    };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validateEmail(value: unknown) {
  if (typeof value !== "string") {
    return { valid: false, message: "Enter a valid email address." };
  }

  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase();
  if (!trimmed || normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
    return { valid: false, message: "Enter a valid email address." };
  }

  return {
    valid: true,
    email: trimmed,
    emailNormalized: normalized,
  };
}

function validateBoolean(value: unknown, fieldName: string) {
  if (typeof value !== "boolean") {
    return { valid: false, message: `${fieldName} must be true or false.` };
  }

  return { valid: true, value };
}

export function validateSettingsRequest(body: unknown): ValidationResult<ValidatedSettingsInput> {
  if (!isObjectRecord(body)) {
    return {
      success: false,
      error: {
        error: "Please correct the highlighted fields.",
      },
    };
  }

  const fullName = typeof body.fullName === "string" ? normalizeText(body.fullName) : "";
  const organizationName =
    typeof body.organizationName === "string" ? normalizeText(body.organizationName) : "";
  const teamSize = typeof body.teamSize === "string" ? normalizeText(body.teamSize) : "";
  const email = validateEmail(body.email);
  const twoFactorEnabled = validateBoolean(body.twoFactorEnabled, "Two-factor preference");
  const sessionAlertsEnabled = validateBoolean(body.sessionAlertsEnabled, "Session alerts");
  const productUpdatesEnabled = validateBoolean(body.productUpdatesEnabled, "Product updates");
  const incidentAlertsEnabled = validateBoolean(body.incidentAlertsEnabled, "Incident alerts");

  const fieldErrors: NonNullable<SettingsErrorResponse["fieldErrors"]> = {};

  if (fullName.length < 2 || fullName.length > 100) {
    fieldErrors.fullName = "Enter your full name.";
  }

  if (!email.valid) {
    fieldErrors.email = email.message;
  }

  if (organizationName.length < 2 || organizationName.length > 120) {
    fieldErrors.organizationName = "Enter a valid organization name.";
  }

  if (teamSize.length > 40) {
    fieldErrors.teamSize = "Keep team size under 40 characters.";
  }

  if (!twoFactorEnabled.valid) {
    fieldErrors.twoFactorEnabled = twoFactorEnabled.message;
  }

  if (!sessionAlertsEnabled.valid) {
    fieldErrors.sessionAlertsEnabled = sessionAlertsEnabled.message;
  }

  if (!productUpdatesEnabled.valid) {
    fieldErrors.productUpdatesEnabled = productUpdatesEnabled.message;
  }

  if (!incidentAlertsEnabled.valid) {
    fieldErrors.incidentAlertsEnabled = incidentAlertsEnabled.message;
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    !email.valid ||
    !twoFactorEnabled.valid ||
    !sessionAlertsEnabled.valid ||
    !productUpdatesEnabled.valid ||
    !incidentAlertsEnabled.valid
  ) {
    return {
      success: false,
      error: {
        error: "Please correct the highlighted fields.",
        fieldErrors,
      },
    };
  }

  return {
    success: true,
    data: {
      fullName,
      email: email.email!,
      emailNormalized: email.emailNormalized!,
      organizationName,
      teamSize,
      twoFactorEnabled: twoFactorEnabled.value!,
      sessionAlertsEnabled: sessionAlertsEnabled.value!,
      productUpdatesEnabled: productUpdatesEnabled.value!,
      incidentAlertsEnabled: incidentAlertsEnabled.value!,
    },
  };
}
