import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/signup/route";
import { authService } from "@/lib/auth/service";

describe("POST /api/auth/signup", () => {
  it("returns a public session and sets the auth cookie", async () => {
    vi.spyOn(authService, "signUp").mockResolvedValue({
      publicSession: {
        authenticated: true,
        user: {
          id: "user-1",
          email: "sarah@example.com",
          fullName: "Sarah Jenkins",
          companyName: "Main Street Bakery",
          role: "admin",
          plan: "free",
          trialEndsAt: "2026-04-07T12:00:00.000Z",
          createdAt: "2026-03-24T12:00:00.000Z",
        },
        plan: "free",
        role: "admin",
        expiresAt: "2026-04-23T12:00:00.000Z",
      },
      rawSessionToken: "raw-session-token",
      expiresAt: new Date("2026-04-23T12:00:00.000Z"),
      rememberMe: true,
    });

    const request = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Vitest",
      },
      body: JSON.stringify({
        fullName: "Sarah Jenkins",
        email: "sarah@example.com",
        companyName: "Main Street Bakery",
        password: "SecurePassword123",
        rememberMe: true,
      }),
    });

    const response = await POST(request);
    const json = await response.json();
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(json).toMatchObject({
      authenticated: true,
      plan: "free",
      role: "admin",
      user: {
        email: "sarah@example.com",
      },
    });
    expect(setCookie).toContain("accesspath_test_session=raw-session-token");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=lax");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("Max-Age=2592000");
  });
});
