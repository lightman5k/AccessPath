import Link from "next/link";
import { Card } from "@/components/ui";

const loginOptions = [
  {
    id: "admin",
    title: "Admin Access",
    description: "Use this entry point for product demos, setup flows, and configuration screens.",
  },
  {
    id: "agent",
    title: "Support Access",
    description: "Use this entry point for service operations, queue reviews, and conversation handling.",
  },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
            AccessPath Demo
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Login</h1>
          <p className="mt-3 text-base text-gray-600">
            Placeholder authentication screen for the MVP demo. Replace the actions below
            with real auth providers, SSO, or environment-specific sign-in flows later.
          </p>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <h2 className="text-lg font-semibold">Sign-In Options</h2>
            <p className="mt-1 text-sm text-gray-600">
              Keep these entry points lightweight for now. Each card can later map to a
              backend auth strategy or role-aware redirect.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {loginOptions.map((option) => (
                <section
                  key={option.id}
                  className="rounded-md border border-gray-200 bg-gray-50 p-4"
                >
                  <h3 className="text-sm font-medium text-gray-900">{option.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{option.description}</p>
                  <Link
                    className="mt-4 inline-flex rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                    href="/dashboard"
                  >
                    Continue to Dashboard
                  </Link>
                </section>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Integration Notes</h2>
            <p className="mt-1 text-sm text-gray-600">
              Suggested placeholders for backend wiring once auth is ready.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-700">
              <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
                Session bootstrap and token exchange
              </li>
              <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
                Role-based redirect after sign-in
              </li>
              <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
                Demo mode toggle and seeded mock session
              </li>
            </ul>
          </Card>
        </section>
      </div>
    </main>
  );
}
