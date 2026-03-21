import Link from "next/link";

const securityItems = [
  {
    title: "Military-Grade Encryption",
    description:
      "Your business data is encrypted at rest and in transit with AES-256 security standards.",
  },
  {
    title: "U.S. Based Infrastructure",
    description:
      "All data is processed and stored on domestic infrastructure to support local compliance needs.",
  },
  {
    title: "Real-time Threat Monitoring",
    description:
      "AccessPath continuously checks for suspicious activity and operational anomalies across your environment.",
  },
];

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
      <path d="M10 12l1.5 1.5L14.5 10" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  );
}

function FieldIcon({ kind }: { kind: "email" | "lock" }) {
  if (kind === "email") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M4 7h16v10H4z" />
        <path d="m5 8 7 6 7-6" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function SecureLoginPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.95fr)_minmax(520px,1.05fr)]">
        <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.12),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(to_bottom,_#eef6ff,_#f6fbff)] px-8 py-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
          <div className="mx-auto flex h-full max-w-xl flex-col">
            <Link className="flex items-center gap-3" href="/login">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-[0_10px_24px_rgba(2,132,199,0.22)]">
                <BrandIcon />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">AccessPath</p>
                <p className="text-sm font-semibold tracking-tight text-sky-700">for Business</p>
              </div>
            </Link>

            <div className="mt-16">
              <span className="rounded-full bg-white/70 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-700 ring-1 ring-sky-100">
                Enterprise Security for Small Business
              </span>
              <h1 className="mt-6 max-w-md text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                AI Automation with{" "}
                <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                  Zero Trust Infrastructure.
                </span>
              </h1>
              <p className="mt-5 max-w-md text-base leading-8 text-slate-600">
                Join thousands of U.S. small businesses using AccessPath to save time, protect
                sensitive operations, and centralize AI-assisted service management.
              </p>
            </div>

            <div className="mt-10 space-y-6">
              {securityItems.map((item) => (
                <div
                  className="flex gap-4 border-b border-sky-100/80 pb-6 last:border-b-0 last:pb-0"
                  key={item.title}
                >
                  <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-100">
                    <ShieldIcon />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-950">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-10">
              <div className="rounded-[26px] border border-sky-100 bg-white/80 p-5 shadow-[0_16px_44px_rgba(15,23,42,0.06)] backdrop-blur">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white">
                    <ShieldIcon />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Cloud-First Reliability</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      &quot;AccessPath streamlined my bakery&apos;s logistics while keeping our vendor data
                      strictly private.&quot;
                    </p>
                    <p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-700">
                      Sarah J, Main Street Bakery
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-8 py-12 lg:px-12">
          <div className="w-full max-w-md">
            <div>
              <p className="text-sm font-medium text-sky-700">Secure access</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Secure Sign In
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Enter your credentials to access your operation centers.
              </p>
            </div>

            <div className="mt-10 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
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
                    defaultValue="admin@mainstreetbakery.com"
                    id="work-email"
                    type="email"
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
                    defaultValue="password123"
                    id="password"
                    type="password"
                  />
                </div>
              </div>

              <label className="mt-5 flex items-center gap-3 text-sm text-slate-600">
                <input className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-300" type="checkbox" />
                <span>Keep me signed in for 30 days</span>
              </label>

              <Link
                className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                href="/dashboard"
              >
                Secure Sign In
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
              </Link>

              <div className="mt-6 border-t border-slate-200 pt-5 text-center">
                <p className="text-sm text-slate-600">
                  Don&apos;t have an account?{" "}
                  <Link className="font-medium text-sky-700 transition hover:text-sky-800" href="/login">
                    Start 14-day Free Trial
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <span>SOC2 Type II</span>
              <span>GDPR Ready</span>
              <span>256-bit SSL</span>
            </div>

            <p className="mt-6 text-sm leading-7 text-slate-500">
              By signing in, you agree to our Privacy Policy and Terms of Cloud Service.
            </p>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-8 py-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 AccessPath for Business. AI-Powered Excellence.</p>
          <div className="flex items-center gap-5">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Compliance</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
