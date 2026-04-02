import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/signup/route";
import { readFile, writeFile } from "node:fs/promises";

const usersPath = "data/auth/users.json";
const sessionsPath = "data/auth/sessions.json";

let originalUsers = "";
let originalSessions = "";

async function backup() {
  originalUsers = await readFile(usersPath, "utf8");
  originalSessions = await readFile(sessionsPath, "utf8");
}

async function restore() {
  await writeFile(usersPath, originalUsers, "utf8");
  await writeFile(sessionsPath, originalSessions, "utf8");
}

describe("signup integration temp", async () => {
  await backup();

  afterAll(async () => {
    await restore();
  });

  it("creates account", async () => {
    const request = new NextRequest("http://localhost/api/auth/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Vitest",
      },
      body: JSON.stringify({
        fullName: "Temp User",
        email: "temp-signup@example.com",
        companyName: "Temp Company",
        password: "SecurePassword123",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toMatchObject({ authenticated: true });
  });
});
