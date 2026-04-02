import { NextRequest, NextResponse } from "next/server";
import {
  buildApiErrorResponse,
  buildApiNoStoreHeaders,
  requireApiSession,
} from "@/lib/auth/api-guard";
import type { ScheduleRequest, ScheduleResponse, ScheduleSlot } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaultTimezone = "America/Chicago";
const defaultDurationMinutes = 30;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildSlot(
  baseDate: Date,
  dayOffset: number,
  hour: number,
  minute: number,
  durationMinutes: number,
  timezone: string,
): ScheduleSlot {
  const start = addDays(startOfDay(baseDate), dayOffset);
  start.setHours(hour, minute, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationMinutes);

  const label = start.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    id: `slot-${start.toISOString()}`,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label,
    timezone,
  };
}

function buildMockSlots(durationMinutes: number, timezone: string) {
  const baseDate = new Date();

  return [
    buildSlot(baseDate, 1, 9, 0, durationMinutes, timezone),
    buildSlot(baseDate, 1, 11, 30, durationMinutes, timezone),
    buildSlot(baseDate, 1, 14, 0, durationMinutes, timezone),
    buildSlot(baseDate, 2, 10, 0, durationMinutes, timezone),
    buildSlot(baseDate, 2, 13, 30, durationMinutes, timezone),
    buildSlot(baseDate, 3, 15, 0, durationMinutes, timezone),
  ];
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesPreferredDate(slot: ScheduleSlot, preferredDate?: string) {
  if (!preferredDate) return true;
  return slot.startIso.startsWith(preferredDate);
}

function matchesMessageHints(slot: ScheduleSlot, message: string) {
  const normalized = normalize(message);
  const hour = new Date(slot.startIso).getHours();

  if (normalized.includes("morning") && hour >= 12) return false;
  if (normalized.includes("afternoon") && (hour < 12 || hour >= 17)) return false;
  if (normalized.includes("tomorrow")) {
    const tomorrow = addDays(startOfDay(new Date()), 1).toISOString().slice(0, 10);
    return slot.startIso.startsWith(tomorrow);
  }
  if (normalized.includes("next week")) {
    const nextWeekStart = addDays(startOfDay(new Date()), 7);
    return new Date(slot.startIso) >= nextWeekStart;
  }

  return true;
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  let body: ScheduleRequest;

  try {
    body = (await request.json()) as ScheduleRequest;
  } catch {
    return buildApiErrorResponse(
      {
        error: "Invalid JSON body.",
        code: "invalid_request",
      },
      400,
    );
  }

  const message = body.message?.trim();
  if (!message) {
    return buildApiErrorResponse(
      {
        error: "A scheduling message is required.",
        code: "invalid_request",
      },
      400,
    );
  }

  const timezone = body.timezone?.trim() || defaultTimezone;
  const durationMinutes =
    typeof body.durationMinutes === "number" && body.durationMinutes > 0
      ? Math.floor(body.durationMinutes)
      : defaultDurationMinutes;

  const availableSlots = buildMockSlots(durationMinutes, timezone)
    .filter((slot) => matchesPreferredDate(slot, body.preferredDate))
    .filter((slot) => matchesMessageHints(slot, message))
    .slice(0, 3);

  const response: ScheduleResponse = {
    intent: "booking",
    confidence: availableSlots.length > 0 ? 0.93 : 0.72,
    reply:
      availableSlots.length > 0
        ? "I found a few available booking options that fit this request. The customer can choose one of the suggested appointment slots below."
        : "I could not find a perfect match in the current mock schedule, but I can suggest the next available appointment options or ask for a different day.",
    availableSlots,
    suggestedNextAction:
      availableSlots.length > 0
        ? "Ask the customer to confirm one of the suggested time slots."
        : "Ask whether the customer prefers a different day or time window.",
  };

  return NextResponse.json(response, {
    headers: buildApiNoStoreHeaders(),
  });
}
