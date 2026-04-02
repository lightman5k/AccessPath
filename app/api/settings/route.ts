import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildApiNoStoreHeaders, requireApiSession } from "@/lib/auth/api-guard";
import { FileUserRepository } from "@/lib/auth/file-user-repository";
import {
  FileSettingsRepository,
  buildSettingsState,
} from "@/lib/settings/file-settings-repository";
import { validateSettingsRequest } from "@/lib/settings/validation";
import type {
  PublicUser,
  SettingsApiResponse,
  SettingsAuditLogEntry,
  SettingsErrorResponse,
  StoredSettingsAuditLogEntry,
  StoredUser,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: buildApiNoStoreHeaders(),
  });
}

function toAuditLogEntry(entry: StoredSettingsAuditLogEntry): SettingsAuditLogEntry {
  return {
    id: entry.id,
    event: entry.event,
    actor: entry.actor,
    status: entry.status,
    time: entry.time,
  };
}

async function ensureSettingsUser(
  userRepository: FileUserRepository,
  currentUser: PublicUser,
): Promise<StoredUser> {
  const existingUser = await userRepository.findById(currentUser.id);
  if (existingUser) return existingUser;

  const nowIso = new Date().toISOString();
  const fallbackUser: StoredUser = {
    id: currentUser.id,
    email: currentUser.email,
    emailNormalized: currentUser.email.trim().toLowerCase(),
    fullName: currentUser.fullName,
    companyName: currentUser.companyName,
    passwordHash: "",
    role: currentUser.role,
    plan: currentUser.plan,
    trialEndsAt: currentUser.trialEndsAt,
    status: "active",
    createdAt: currentUser.createdAt,
    updatedAt: nowIso,
  };

  try {
    return await userRepository.create(fallbackUser);
  } catch {
    return fallbackUser;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<SettingsErrorResponse>({ error: "Authentication required." }, 401);
  }

  const userRepository = new FileUserRepository();
  const settingsRepository = new FileSettingsRepository();

  const storedUser = await ensureSettingsUser(userRepository, currentUser);
  const storedSettings = await settingsRepository.findByUserId(currentUser.id);
  const auditLog = await settingsRepository.listAuditLog(currentUser.id);

  const payload: SettingsApiResponse = {
    settings: buildSettingsState(
      {
        fullName: storedUser.fullName,
        email: storedUser.email,
        organizationName: storedUser.companyName,
      },
      storedSettings,
    ),
    auditLog: auditLog.map(toAuditLogEntry),
  };

  return jsonResponse(payload);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  const currentUser = auth.session.user;
  if (!currentUser) {
    return jsonResponse<SettingsErrorResponse>({ error: "Authentication required." }, 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse<SettingsErrorResponse>({ error: "Invalid JSON body." }, 400);
  }

  const validation = validateSettingsRequest(body);
  if (!validation.success) {
    return jsonResponse<SettingsErrorResponse>(validation.error, 400);
  }

  const userRepository = new FileUserRepository();
  const settingsRepository = new FileSettingsRepository();
  const existingUser = await ensureSettingsUser(userRepository, currentUser);

  const previousSettings = buildSettingsState(
    {
      fullName: existingUser.fullName,
      email: existingUser.email,
      organizationName: existingUser.companyName,
    },
    await settingsRepository.findByUserId(currentUser.id),
  );

  try {
    const updatedUser = await userRepository.updateProfile(currentUser.id, {
      fullName: validation.data.fullName,
      email: validation.data.email,
      emailNormalized: validation.data.emailNormalized,
      companyName: validation.data.organizationName,
    });

    const storedSettings = await settingsRepository.upsert(currentUser.id, {
      teamSize: validation.data.teamSize,
      twoFactorEnabled: validation.data.twoFactorEnabled,
      sessionAlertsEnabled: validation.data.sessionAlertsEnabled,
      productUpdatesEnabled: validation.data.productUpdatesEnabled,
      incidentAlertsEnabled: validation.data.incidentAlertsEnabled,
    });

    const nextSettings = buildSettingsState(
      {
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        organizationName: updatedUser.companyName,
      },
      storedSettings,
    );

    const actor = updatedUser.fullName || updatedUser.email;
    const nowIso = new Date().toISOString();
    const auditEntries: StoredSettingsAuditLogEntry[] = [];

    if (
      previousSettings.fullName !== nextSettings.fullName ||
      previousSettings.email !== nextSettings.email
    ) {
      auditEntries.push({
        id: randomUUID(),
        userId: currentUser.id,
        event: "Profile updated",
        actor,
        status: "Success",
        time: nowIso,
      });
    }

    if (
      previousSettings.organizationName !== nextSettings.organizationName ||
      previousSettings.teamSize !== nextSettings.teamSize
    ) {
      auditEntries.push({
        id: randomUUID(),
        userId: currentUser.id,
        event: "Organization settings updated",
        actor,
        status: "Success",
        time: nowIso,
      });
    }

    if (
      previousSettings.twoFactorEnabled !== nextSettings.twoFactorEnabled ||
      previousSettings.sessionAlertsEnabled !== nextSettings.sessionAlertsEnabled
    ) {
      auditEntries.push({
        id: randomUUID(),
        userId: currentUser.id,
        event: "Security preferences updated",
        actor,
        status: "Success",
        time: nowIso,
      });
    }

    if (
      previousSettings.productUpdatesEnabled !== nextSettings.productUpdatesEnabled ||
      previousSettings.incidentAlertsEnabled !== nextSettings.incidentAlertsEnabled
    ) {
      auditEntries.push({
        id: randomUUID(),
        userId: currentUser.id,
        event: "Notification preferences updated",
        actor,
        status: "Success",
        time: nowIso,
      });
    }

    if (auditEntries.length > 0) {
      await settingsRepository.appendAuditLog(auditEntries);
    }

    const auditLog = await settingsRepository.listAuditLog(currentUser.id);
    const payload: SettingsApiResponse = {
      settings: nextSettings,
      auditLog: auditLog.map(toAuditLogEntry),
    };

    return jsonResponse(payload);
  } catch (error) {
    if ((error as Error).message === "AUTH_USER_CONFLICT") {
      return jsonResponse<SettingsErrorResponse>(
        {
          error: "That email address is already in use.",
          fieldErrors: {
            email: "That email address is already in use.",
          },
        },
        409,
      );
    }

    return jsonResponse<SettingsErrorResponse>(
      { error: "Unable to update your profile settings." },
      500,
    );
  }
}
