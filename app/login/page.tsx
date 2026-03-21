import Link from "next/link";
import { Badge, Card } from "@/components/ui";

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Pricing", href: "#impact" },
  { label: "Demo", href: "#cta" },
];

const featureCards = [
  {
    id: "support",
    title: "AI Customer Service",
    description:
      "Respond to customer questions with faster triage, cleaner routing, and consistent answers across your support channels.",
    accent: "from-sky-50 to-white",
    icon: "spark",
  },
  {
    id: "workflow",
    title: "Workflow Automation",
    description:
      "Coordinate order events, approvals, and team handoffs through guided workflows and automation rules.",
    accent: "from-slate-50 to-white",
    icon: "flow",
  },
  {
    id: "logistics",
    title: "Logistics Optimization",
    description:
      "Surface delivery issues, routing delays, and operational risks before they become customer-facing problems.",
    accent: "from-cyan-50 to-white",
    icon: "route",
  },
];

const impactStats = [
  { label: "Total value tracked", value: "$24M+" },
  { label: "Processing accuracy", value: "1.2M" },
  { label: "Time reclaimed", value: "4,800h" },
  { label: "Customer coverage", value: "99.9%" },
];

const footerColumns = [
  {
    title: "Product",
    links: ["Overview", "Customer Service", "Analytics", "Templates"],
  },
  {
    title: "Company",
    links: ["About", "Partner Program", "Security"],
  },
  {
    title: "Support",
    links: ["Help Center", "Documentation", "Contact Sales"],
  },
];

function FeatureIcon({ kind }: { kind: "spark" | "flow" | "route" | "pulse" }) {
  if (kind === "spark") {
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
        <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
        <path d="M5 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
      </svg>
    );
  }

  if (kind === "flow") {
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
        <circle cx="6" cy="7" r="2" />
        <circle cx="18" cy="7" r="2" />
        <circle cx="12" cy="17" r="2" />
        <path d="M8 7h8" />
        <path d="M7.5 8.5 11 15" />
        <path d="M16.5 8.5 13 15" />
      </svg>
    );
  }

  if (kind === "route") {
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
        <path d="M5 19V9" />
        <path d="M19 5v10" />
        <path d="M5 9c0-2 2-4 4-4h10" />
        <path d="M19 15c0 2-2 4-4 4H5" />
        <path d="M8 19H4" />
        <path d="M20 5h-4" />
      </svg>
    );
  }

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

function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-[560px]">
      <div className="absolute inset-x-8 top-8 h-72 rounded-full bg-sky-100/70 blur-3xl" />
      <Card className="relative rounded-[30px] border-slate-200 bg-white p-4 shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              AccessPath Pulse
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-medium text-slate-600">
              Revenue
            </span>
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[0.68rem] font-medium text-sky-700">
              Sync Live
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[110px_minmax(0,1fr)] gap-4">
          <div className="space-y-2 rounded-[22px] border border-slate-200 bg-slate-50 p-3">
            {["Dashboard", "Support", "Insights", "Analytics"].map((item, index) => (
              <div
                className={`rounded-xl px-3 py-2 text-xs font-medium ${
                  index === 1 ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
                key={item}
              >
                {item}
              </div>
            ))}
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">Operational Insights</p>
                <p className="mt-1 text-xs text-slate-500">Weekly performance model</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.68rem] font-medium text-emerald-700">
                System Healthy
              </span>
            </div>

            <div className="mt-4 h-40 rounded-[20px] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.9),rgba(241,245,249,0.85))] p-3">
              <svg aria-hidden="true" className="h-full w-full" fill="none" viewBox="0 0 320 160">
                <path d="M16 128H304" stroke="#CBD5E1" strokeDasharray="4 6" />
                <path d="M16 88H304" stroke="#E2E8F0" />
                <path d="M16 48H304" stroke="#E2E8F0" />
                <path
                  d="M18 118C42 110 55 96 79 92C110 86 126 100 152 84C176 70 188 41 216 35C241 29 264 48 302 18"
                  stroke="#0EA5E9"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
                <path
                  d="M18 118C42 110 55 96 79 92C110 86 126 100 152 84C176 70 188 41 216 35C241 29 264 48 302 18V144H18Z"
                  fill="url(#chartGradient)"
                  opacity="0.22"
                />
                <defs>
                  <linearGradient id="chartGradient" x1="160" x2="160" y1="18" y2="144">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#FFFFFF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {[
                { label: "Revenue", value: "$12.4K" },
                { label: "Lead Time", value: "8.6h" },
                { label: "AI Accuracy", value: "92%" },
                { label: "Suggestions", value: "18" },
              ].map((stat) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3" key={stat.label}>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="absolute -bottom-5 -left-6 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <FeatureIcon kind="pulse" />
          </span>
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Performance
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">82.4k interactions monitored</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.08),_transparent_28%),linear-gradient(to_bottom,_#ffffff,_#f8fbff_52%,_#ffffff)] text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link className="flex items-center gap-3" href="/login">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-[0_10px_24px_rgba(2,132,199,0.26)]">
              <FeatureIcon kind="pulse" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">AccessPath</p>
              <p className="text-sm font-semibold tracking-tight text-sky-700">for Business</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((item) => (
              <a className="text-sm font-medium text-slate-600 transition hover:text-slate-950" href={item.href} key={item.label}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              className="hidden text-sm font-medium text-slate-700 transition hover:text-slate-950 sm:inline-flex"
              href="/login/secure"
            >
              Login
            </Link>
            <Link
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
              href="/dashboard"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_540px] lg:py-24">
        <div>
          <Badge variant="info" className="px-3 py-1">
            AccessPath MVP
          </Badge>
          <h1 className="mt-7 max-w-xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            Empower Your{" "}
            <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
              Small Business
            </span>{" "}
            with Elite AI.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            AccessPath brings live automation, customer intelligence, and operational visibility
            into one practical business console. Reduce manual overhead, respond faster, and run a
            sharper service operation with one demo-ready platform.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
              href="/dashboard"
            >
              Start Admin Demo
            </Link>
            <Link
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
              href="/customer-service"
            >
              Watch Service View
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, index) => (
                <span key={index}>★</span>
              ))}
            </div>
            <p className="text-sm text-slate-600">
              Rated 4.9/5 by operations teams running modern support and logistics workflows.
            </p>
          </div>
        </div>

        <DashboardPreview />
      </section>

      <section className="border-y border-slate-200 bg-white/80">
        <div className="mx-auto max-w-7xl px-6 py-7">
          <p className="text-center text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Trusted by modern teams across retail, logistics, and operations
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 text-center text-sm font-medium text-slate-400 sm:grid-cols-4 lg:grid-cols-6">
            {["Northstar", "Atlas", "Mercury", "BlueCart", "Relay", "Verve"].map((brand) => (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3" key={brand}>
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20" id="platform">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
            One Platform. Infinite Scale.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Move the right business signals into one operating layer so every team can work faster,
            escalate less, and act with clearer insight.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <Card
              className={`rounded-[26px] border-slate-200 bg-gradient-to-br ${feature.accent} p-6 shadow-[0_14px_38px_rgba(15,23,42,0.05)]`}
              key={feature.id}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm ring-1 ring-slate-200">
                <FeatureIcon kind={feature.icon as "spark" | "flow" | "route"} />
              </span>
              <h3 className="mt-6 text-lg font-semibold tracking-tight text-slate-950">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
              <Link
                className="mt-6 inline-flex text-sm font-medium text-sky-700 transition hover:text-sky-800"
                href="/dashboard"
              >
                Explore Module →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-[#eef6ff] py-18" id="impact">
        <div className="mx-auto max-w-7xl px-6">
          <Card className="rounded-[30px] border-sky-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:items-start">
              <div>
                <Badge variant="info" className="px-3 py-1">
                  Impact Snapshot
                </Badge>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                  The &quot;Main Street&quot; Impact
                </h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
                  AccessPath turns small-business operations into one managed control plane. Track
                  support performance, streamline routing, and elevate AI-assisted service with
                  cleaner workflows.
                </p>

                <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
                  <li className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                    Reduce escalated inbound volume by routing faster with AI guidance.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                    Keep every operational team working from one shared intelligence layer.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                    Deploy premium automation flows without adding enterprise complexity.
                  </li>
                </ul>

                <Link
                  className="mt-8 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                  href="/analytics"
                >
                  View Impact Dashboard
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {impactStats.map((stat) => (
                  <div
                    className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5"
                    key={stat.label}
                  >
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-4 text-3xl font-semibold tracking-tight text-sky-700">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20" id="cta">
        <div className="mx-auto max-w-3xl rounded-[30px] bg-[#17181f] px-8 py-12 text-center shadow-[0_26px_70px_rgba(15,23,42,0.18)]">
          <Badge variant="info" className="border border-sky-500/20 bg-sky-500/15 px-3 py-1 text-sky-200">
            Launch Demo
          </Badge>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-white">
            Ready to reclaim your time?
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-300">
            Join teams using AccessPath to align service, automation, and visibility into one
            cleaner operating surface.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#17181f]"
              href="/dashboard"
            >
              Start Free Trial
            </Link>
            <Link
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#17181f]"
              href="/customer-service"
            >
              Talk to Sales
            </Link>
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-slate-500">
            No credit card required for the MVP demo flow
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.2fr_repeat(3,0.8fr)]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-[0_10px_24px_rgba(2,132,199,0.22)]">
                <FeatureIcon kind="pulse" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">AccessPath</p>
                <p className="text-sm font-semibold tracking-tight text-sky-700">for Business</p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-600">
              Helping operations teams move faster with AI-guided customer service, workflow
              orchestration, and operational visibility.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-slate-950">{column.title}</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {column.links.map((link) => (
                  <li key={link}>{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 AccessPath for Business. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Privacy</span>
              <span>Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
