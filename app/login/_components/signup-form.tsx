"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { AuthErrorResponse, AuthSessionResponse } from "@/types";
import { FieldIcon } from "./auth-shell";

type SignupFieldErrors = Partial<{
  fullName: string;
  email: string;
  companyName: string;
  password: string;
  rememberMe: string;
}>;

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          companyName,
          password,
        }),
      });

      const payload = (await response.json()) as AuthSessionResponse | AuthErrorResponse;

      if (!response.ok) {
        const message = "error" in payload && payload.error ? payload.error : "Unable to create account.";
        setErrorMessage(message);
        setFieldErrors("fieldErrors" in payload && payload.fieldErrors ? payload.fieldErrors : {});
        return;
      }

      if (!("authenticated" in payload) || !payload.authenticated || !payload.plan || !payload.role) {
        setErrorMessage("Unable to establish a signed-in session.");
        return;
      }

      window.location.assign("/dashboard");
    } catch {
      setErrorMessage("Unable to create your account right now. Please try again.");
      setFieldErrors({});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-10 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="full-name">
          Full Name
        </label>
        <div className={`mt-2 flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 shadow-sm ${
          fieldErrors.fullName ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200"
        }`}>
          <span className="text-slate-400">
            <FieldIcon kind="user" />
          </span>
          <input
            aria-invalid={Boolean(fieldErrors.fullName)}
            aria-describedby={fieldErrors.fullName ? "full-name-error" : undefined}
            className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
            id="full-name"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your full name"
            type="text"
            value={fullName}
          />
        </div>
        {fieldErrors.fullName ? (
          <p id="full-name-error" className="mt-1 text-xs text-rose-700">
            {fieldErrors.fullName}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label className="text-sm font-medium text-slate-700" htmlFor="trial-email">
          Work Email
        </label>
        <div className={`mt-2 flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 shadow-sm ${
          fieldErrors.email ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200"
        }`}>
          <span className="text-slate-400">
            <FieldIcon kind="email" />
          </span>
          <input
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
            id="trial-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            type="email"
            value={email}
          />
        </div>
        {fieldErrors.email ? (
          <p id="email-error" className="mt-1 text-xs text-rose-700">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label className="text-sm font-medium text-slate-700" htmlFor="company-name">
          Company Name
        </label>
        <div className={`mt-2 flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 shadow-sm ${
          fieldErrors.companyName ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200"
        }`}>
          <span className="text-slate-400">
            <FieldIcon kind="building" />
          </span>
          <input
            aria-invalid={Boolean(fieldErrors.companyName)}
            aria-describedby={fieldErrors.companyName ? "company-name-error" : undefined}
            className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
            id="company-name"
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Your company name"
            type="text"
            value={companyName}
          />
        </div>
        {fieldErrors.companyName ? (
          <p id="company-name-error" className="mt-1 text-xs text-rose-700">
            {fieldErrors.companyName}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label className="text-sm font-medium text-slate-700" htmlFor="trial-password">
          Create Password
        </label>
        <div className={`mt-2 flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 shadow-sm ${
          fieldErrors.password ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200"
        }`}>
          <span className="text-slate-400">
            <FieldIcon kind="lock" />
          </span>
          <input
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "trial-password-error" : undefined}
            className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
            id="trial-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create a secure password"
            type="password"
            value={password}
          />
        </div>
        {fieldErrors.password ? (
          <p id="trial-password-error" className="mt-1 text-xs text-rose-700">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm text-slate-600">
        <input
          checked={marketingOptIn}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-300"
          onChange={(event) => setMarketingOptIn(event.target.checked)}
          type="checkbox"
        />
        <span>Send setup tips, onboarding updates, and product guidance to my work email.</span>
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
        {submitting ? "Creating Account..." : "Sign Up"}
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

      <p className="mt-3 text-center text-sm text-slate-500">
        Sign up to start your 14-day trial. No credit card required.
      </p>

      <div className="mt-6 border-t border-slate-200 pt-5 text-center">
        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-medium text-sky-700 transition hover:text-sky-800" href="/login/secure">
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );
}
