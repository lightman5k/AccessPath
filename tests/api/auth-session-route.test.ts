import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/current-session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/current-session")>();
  return {
    ...actual,
    getCurrentSessionFromRequest: vi.fn(),
  };
});

import { GET } from "@/app/api/auth/session/route";
import { getCurrentSessionFromRequest } from "@/lib/auth/current-session";

describe("GET /api/auth/session", () => {
  it("returns the current public session with no-store headers", async () => {
    vi.mocked(getCurrentSessionFromRequest).mockResolvedValue({
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
    });

    const response = await GET(new NextRequest("http://localhost/api/auth/session"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
    await expect(response.json()).resolves.toMatchObject({
      authenticated: true,
      plan: "free",
      role: "admin",
    });
  });

  it("returns a server error if session lookup fails", async () => {
    vi.mocked(getCurrentSessionFromRequest).mockRejectedValue(new Error("boom"));

    const response = await GET(new NextRequest("http://localhost/api/auth/session"));

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Unable to process request.",
      code: "server_error",
    });
  });
});
