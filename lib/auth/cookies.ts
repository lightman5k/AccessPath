import type { NextRequest, NextResponse } from "next/server";
import { authConfig, getSessionMaxAgeSeconds } from "./config";

export function readAuthSessionCookie(request: NextRequest) {
  return request.cookies.get(authConfig.cookieName)?.value ?? null;
}

export function setAuthSessionCookie(
  response: NextResponse,
  rawToken: string,
  expiresAt: Date,
  rememberMe: boolean,
) {
  response.cookies.set({
    name: authConfig.cookieName,
    value: rawToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: authConfig.isProduction,
    expires: expiresAt,
    maxAge: getSessionMaxAgeSeconds(rememberMe),
  });
}

export function clearAuthSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: authConfig.cookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: authConfig.isProduction,
    expires: new Date(0),
    maxAge: 0,
  });
}
