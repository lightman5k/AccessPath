import Link from "next/link";
import { Badge, Card } from "@/components/ui";

const loginOptions = [
  {
    id: "admin",
    title: "Admin Access",
    description: "Use this entry point for product demos, setup flows, analytics, and configuration screens.",
    helper: "Best for product, operations, and leadership walkthroughs.",
    accentClass: "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
    iconClass: "bg-sky-100 text-sky-700",
  },
  {
    id: "agent",
    title: "Support Access",
    description: "Use this entry point for service operations, queue reviews, and customer conversation handling.",
    helper: "Best for support-team and AI-assistant workflow demos.",
    accentClass: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    iconClass: "bg-emerald-100 text-emerald-700",
  },
];

function AccessIcon({ kind }: { kind: "admin" | "agent" }) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (kind === "admin") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" {...commonProps}>
        <path d="M12 4 4 8l8 4 8-4-8-4Z" />
        <path d="M6 10.5v4.5c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-4.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" {...commonProps}>
      <path d="M5 18v-1.5A3.5 3.5 0 0 1 8.5 13H11" />
      <circle cx="9" cy="8" r="3" />
      <path d="M15 17l2 2 4-4" />
    </svg>
  );
}

function NoteIcon() {
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
      <path d="M7 5h10" />
      <path d="M7 10h10" />
      <path d="M7 15h6" />
      <path d="M5 5h.01" />
      <path d="M5 10h.01" />
      <path d="M5 15h.01" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.1),_transparent_24%),linear-gradient(to_bottom,_#f8fafc,_#f8fafc)] px-6 py-16 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-3xl">
          <Badge variant="info" className="px-3 py-1">
            AccessPath MVP
          </Badge>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-gray-950">
            AccessPath Admin Sign-In
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
            Enter the demo environment through the role that best matches your walkthrough. The
            current login flow stays lightweight, while the visual presentation now matches the
            rest of the polished MVP.
          </p>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-gray-950">Sign-In Options</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Keep these entry points lightweight for now. Each card can later map to a real
                  backend auth strategy or role-aware redirect.
                </p>
              </div>
              <Badge variant="neutral">Demo access</Badge>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {loginOptions.map((option) => (
                <section
                  key={option.id}
                  className={`relative overflow-hidden rounded-xl border p-5 shadow-sm ${option.accentClass}`}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-400" />
                  <div className={`inline-flex rounded-xl p-2.5 ${option.iconClass}`}>
                    <AccessIcon kind={option.id as "admin" | "agent"} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-gray-950">{option.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{option.description}</p>
                  <p className="mt-3 text-sm font-medium text-gray-700">{option.helper}</p>
                  <Link
                    className="mt-5 inline-flex rounded-md border border-gray-900 bg-gray-900 px-3 py-2 text-sm text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    href="/dashboard"
                  >
                    Continue to Dashboard
                  </Link>
                </section>
              ))}
            </div>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="rounded-full bg-violet-100 p-2 text-violet-700">
                <NoteIcon />
              </span>
              Setup Notes
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Integration Notes</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Suggested placeholders for backend wiring once authentication is ready.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-700">
              <li className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
                Session bootstrap and token exchange
              </li>
              <li className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
                Role-based redirect after sign-in
              </li>
              <li className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
                Demo mode toggle and seeded mock session
              </li>
            </ul>
          </Card>
        </section>
      </div>
    </main>
  );
}
