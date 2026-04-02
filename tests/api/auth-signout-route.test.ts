import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/signout/route";
import { authService } from "@/lib/auth/service";

describe("POST /api/auth/signout", () => {
  it("clears the auth cookie and returns success", async () => {
    vi.spyOn(authService, "revokeSession").mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost/api/auth/signout", {
      method: "POST",
      headers: {
        cookie: "accesspath_test_session=raw-session-token",
      },
    });

    const response = await POST(request);
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      authenticated: false,
    });
    expect(setCookie).toContain("accesspath_test_session=");
    expect(setCookie).toContain("Max-Age=0");
    expect(setCookie).toContain("HttpOnly");
  });

  it("still succeeds if session revocation fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(authService, "revokeSession").mockRejectedValue(new Error("revoke failed"));

    const request = new NextRequest("http://localhost/api/auth/signout", {
      method: "POST",
      headers: {
        cookie: "accesspath_test_session=raw-session-token",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      authenticated: false,
    });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(errorSpy).toHaveBeenCalledWith(
      "Auth signout revoke failed.",
      expect.any(Error),
    );
  });
});
