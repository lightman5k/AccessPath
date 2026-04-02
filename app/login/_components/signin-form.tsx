"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { AuthErrorResponse, AuthSessionResponse } from "@/types";
import { FieldIcon } from "./auth-shell";

export function SigninForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      });

      const payload = (await response.json()) as AuthSessionResponse | AuthErrorResponse;

      if (!response.ok) {
        setErrorMessage(
          "error" in payload && payload.error ? payload.error : "Unable to sign in.",
        );
        return;
      }

      if (!("authenticated" in payload) || !payload.authenticated || !payload.plan || !payload.role) {
        setErrorMessage("Unable to establish a signed-in session.");
        return;
      }

      router.replace("/dashboard");
    } catch {
      setErrorMessage("Unable to sign in right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-10 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="work-email">
          Work Email
        </label>
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
          <span className="text-slate-400">
            <FieldIcon kind="email" />
          </span>
          <input
            className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
            id="work-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            type="text"
            value={email}
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <button
            className="text-xs font-medium text-sky-700 transition hover:text-sky-800"
            type="button"
          >
            Forgot password?
          </button>
        </div>
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
          <span className="text-slate-400">
            <FieldIcon kind="lock" />
          </span>
          <input
            className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            type="password"
            value={password}
          />
        </div>
      </div>

      <label className="mt-5 flex items-center gap-3 text-sm text-slate-600">
        <input
          checked={rememberMe}
          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-300"
          onChange={(event) => setRememberMe(event.target.checked)}
          type="checkbox"
        />
        <span>Keep me signed in for 30 days</span>
      </label>

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Signing In..." : "Sign In"}
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </button>

      <div className="mt-6 border-t border-slate-200 pt-5 text-center">
        <p className="text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link className="font-medium text-sky-700 transition hover:text-sky-800" href="/login/signup">
            Sign Up
          </Link>
        </p>
      </div>
    </form>
  );
}
