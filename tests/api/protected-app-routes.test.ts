import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/api-guard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/api-guard")>();
  return {
    ...actual,
    requireApiSession: vi.fn(),
  };
});

import { GET as getDashboard } from "@/app/api/dashboard/route";
import { GET as getInsights } from "@/app/api/insights/route";
import { GET as getIntegrations } from "@/app/api/integrations/route";
import { POST as postChat } from "@/app/api/chat/route";
import { POST as postSchedule } from "@/app/api/schedule/route";
import { requireApiSession } from "@/lib/auth/api-guard";

type RouteDefinition = {
  name: string;
  handler: (request: NextRequest) => Promise<Response>;
  buildRequest: () => NextRequest;
};

const routes: RouteDefinition[] = [
  {
    name: "/api/dashboard",
    handler: getDashboard,
    buildRequest: () => new NextRequest("http://localhost/api/dashboard?range=30d"),
  },
  {
    name: "/api/insights",
    handler: getInsights,
    buildRequest: () => new NextRequest("http://localhost/api/insights"),
  },
  {
    name: "/api/integrations",
    handler: getIntegrations,
    buildRequest: () => new NextRequest("http://localhost/api/integrations"),
  },
  {
    name: "/api/chat",
    handler: postChat,
    buildRequest: () =>
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "What are your business hours?",
        }),
      }),
  },
  {
    name: "/api/schedule",
    handler: postSchedule,
    buildRequest: () =>
      new NextRequest("http://localhost/api/schedule", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Book an appointment tomorrow morning.",
        }),
      }),
  },
];

describe("protected app data APIs", () => {
  it.each(routes)("returns 401 for unauthenticated access to $name", async ({ handler, buildRequest }) => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        {
          error: "Authentication required.",
          code: "unauthorized",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      ),
    });

    const response = await handler(buildRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required.",
      code: "unauthorized",
    });
  });

  it.each(routes)("allows authenticated access to $name", async ({ handler, buildRequest }) => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: {
        authenticated: true,
        user: {
          id: "user-1",
          email: "admin@example.com",
          fullName: "Admin User",
          companyName: "AccessPath",
          role: "admin",
          plan: "free",
          trialEndsAt: "2026-04-07T12:00:00.000Z",
          createdAt: "2026-03-24T12:00:00.000Z",
        },
        plan: "free",
        role: "admin",
        expiresAt: "2026-03-31T12:00:00.000Z",
      },
    });

    const response = await handler(buildRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
