import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/signin/route";
import { AuthServiceError, authService } from "@/lib/auth/service";

describe("POST /api/auth/signin", () => {
  it("returns a generic invalid-credentials error", async () => {
    vi.spyOn(authService, "signIn").mockRejectedValue(
      new AuthServiceError("invalid_credentials", 401, "Invalid email or password."),
    );

    const request = new NextRequest("http://localhost/api/auth/signin", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "missing@example.com",
        password: "WrongPassword123",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Invalid email or password.",
      code: "invalid_credentials",
    });
  });
});
