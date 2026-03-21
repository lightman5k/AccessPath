"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Toast } from "@/components/ui";

type TemplateCategory =
  | "All"
  | "Retail"
  | "Hospitality"
  | "E-commerce"
  | "Professional Services"
  | "Service Providers";

type TemplateItem = {
  id: string;
  title: string;
  category: Exclude<TemplateCategory, "All">;
  tier: "Starter" | "Medium" | "Advanced";
  efficiencyLabel: string;
  description: string;
  savings: string;
  modules: string[];
  featured?: boolean;
};

const categoryOptions: TemplateCategory[] = [
  "All",
  "Retail",
  "Hospitality",
  "E-commerce",
  "Professional Services",
  "Service Providers",
];

const templateItems: TemplateItem[] = [
  {
    id: "retail-concierge",
    title: "Modern Retail Concierge",
    category: "Retail",
    tier: "Starter",
    efficiencyLabel: "High Efficiency",
    description:
      "Automate customer inquiries, track local inventory, and manage pickup scheduling with AI-driven logistics and support.",
    savings: "12 hrs/week",
    modules: ["Support AI", "Inventory", "Scheduling"],
    featured: true,
  },
  {
    id: "hospitality-hero",
    title: "Hospitality Hero",
    category: "Hospitality",
    tier: "Advanced",
    efficiencyLabel: "Fast Launch",
    description:
      "AI-driven reservation management, room-service automation, and local guest request routing.",
    savings: "20 hrs/week",
    modules: ["Reservations", "Guest Support", "Escalations"],
  },
  {
    id: "commerce-full-stack",
    title: "Smart E-commerce Full-Stack",
    category: "E-commerce",
    tier: "Advanced",
    efficiencyLabel: "Scale Ready",
    description:
      "Dynamic pricing assistant, cross-platform logistics sync, and AI post-purchase support.",
    savings: "25 hrs/week",
    modules: ["Pricing", "Shipping", "Returns"],
  },
  {
    id: "service-automator",
    title: "Professional Service Automator",
    category: "Professional Services",
    tier: "Starter",
    efficiencyLabel: "Simple",
    description:
      "Automated client onboarding, document sorting, and intelligent meeting summaries.",
    savings: "8 hrs/week",
    modules: ["Onboarding", "Documents", "Summaries"],
  },
  {
    id: "field-service",
    title: "Field Service Optimizer",
    category: "Service Providers",
    tier: "Medium",
    efficiencyLabel: "Route Smart",
    description:
      "Real-time route optimization for technicians and automated client arrival notifications.",
    savings: "15 hrs/week",
    modules: ["Routing", "SMS", "Scheduling"],
  },
  {
    id: "qsr-ops",
    title: "QSR Operations Engine",
    category: "Retail",
    tier: "Advanced",
    efficiencyLabel: "Ops Driven",
    description:
      "Automate drive-thru prompts, staffing alerts, and kitchen workflow synchronization.",
    savings: "30 hrs/week",
    modules: ["Voice AI", "Staffing", "Kitchen Flow"],
  },
];

function TemplateIcon({ kind }: { kind: "library" | "search" | "spark" | "gift" | "send" }) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (kind === "library") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M5 5h5v14H5z" />
        <path d="M10 5h5v14h-5" />
        <path d="M15 7h4v12h-4" />
      </svg>
    );
  }

  if (kind === "search") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
    );
  }

  if (kind === "spark") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
      </svg>
    );
  }

  if (kind === "gift") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <rect x="4" y="8" width="16" height="12" rx="2" />
        <path d="M12 8v12" />
        <path d="M4 12h16" />
        <path d="M9.5 8C8 8 7 7 7 5.8 7 4.7 7.9 4 9 4c1.5 0 3 1.7 3 4" />
        <path d="M14.5 8c1.5 0 2.5-1 2.5-2.2 0-1.1-.9-1.8-2-1.8-1.5 0-3 1.7-3 4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
      <path d="M5 12h10" />
      <path d="m11 6 6 6-6 6" />
    </svg>
  );
}

function tierVariant(tier: TemplateItem["tier"]) {
  if (tier === "Advanced") return "warning";
  if (tier === "Medium") return "neutral";
  return "info";
}

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return templateItems.filter((template) => {
      if (activeCategory !== "All" && template.category !== activeCategory) return false;
      if (!query) return true;
      return `${template.title} ${template.description} ${template.category} ${template.modules.join(" ")}`
        .toLowerCase()
        .includes(query);
    });
  }, [activeCategory, searchQuery]);

  const featuredTemplate =
    filteredTemplates.find((template) => template.featured) ??
    templateItems.find((template) => template.featured) ??
    templateItems[0];

  return (
    <div className="space-y-8">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <section className="space-y-3">
        <Badge variant="info" className="px-3 py-1">
          <span className="mr-2 inline-flex align-middle">
            <TemplateIcon kind="library" />
          </span>
          Template Library
        </Badge>
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Launch Your AI Foundation</h1>
          <p className="mt-2 text-sm leading-7 text-gray-600">
            Select a pre-built industry framework to automate your unique business workflows in minutes.
            Each template is optimized for U.S. small business standards.
          </p>
        </div>
      </section>

      <Card className="border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm">
            <span className="text-gray-400">
              <TemplateIcon kind="search" />
            </span>
            <input
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Find a template (e.g. Retail, Inventory, Scheduling...)"
              type="text"
              value={searchQuery}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categoryOptions.map((category) => (
              <button
                key={category}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCategory === category
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setActiveCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          Featured For New Businesses
        </div>

        <Card className="overflow-hidden border-sky-200 bg-gradient-to-r from-sky-50 to-white p-0 shadow-sm">
          <div className="grid grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1.1fr)_320px]">
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{featuredTemplate.tier}</Badge>
                <Badge variant="success">{featuredTemplate.efficiencyLabel}</Badge>
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950">{featuredTemplate.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">{featuredTemplate.description}</p>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  {["MK", "SC", "ER", "JW"].map((initials, index) => (
                    <span
                      key={initials}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[0.68rem] font-semibold text-white ${
                        index === 0
                          ? "bg-sky-600"
                          : index === 1
                            ? "bg-emerald-600"
                            : index === 2
                              ? "bg-violet-600"
                              : "bg-amber-500"
                      }`}
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <span>Joined by 1,200+ businesses this month</span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
                  onClick={() => {
                    setToastMessage(`Applied ${featuredTemplate.title}.`);
                    setToastOpen(true);
                  }}
                  type="button"
                >
                  Get Started with This Template
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onClick={() => {
                    setToastMessage("Sample workflow preview opened.");
                    setToastOpen(true);
                  }}
                  type="button"
                >
                  View Sample Workflow
                  <TemplateIcon kind="send" />
                </button>
              </div>
            </div>

            <div className="relative hidden overflow-hidden border-l border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_100%)] xl:block">
              <div className="absolute inset-8 rounded-[28px] bg-[linear-gradient(140deg,rgba(255,255,255,0.92),rgba(241,245,249,0.94))] shadow-[0_18px_40px_rgba(15,23,42,0.08)]" />
              <div className="absolute right-10 top-12 h-56 w-56 rounded-[40px] border border-gray-100 bg-white/80 shadow-sm" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 shadow-sm">
                  <TemplateIcon kind="spark" />
                </span>
                <p className="text-2xl font-semibold tracking-tight text-gray-950">Retail AI 2.0</p>
                <p className="mt-2 text-sm text-gray-500">Flow mapping ready</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950">Recommended Frameworks</h2>
            <p className="mt-1 text-sm text-gray-600">Showing {filteredTemplates.length} templates for your current view.</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">AI-ready modules</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <TemplateIcon kind="library" />
                </span>
                <Badge variant={tierVariant(template.tier)}>{template.tier}</Badge>
              </div>

              <h3 className="mt-4 text-lg font-semibold tracking-tight text-gray-950">{template.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{template.description}</p>

              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <span className="text-sky-600">
                  <TemplateIcon kind="spark" />
                </span>
                Est. Savings: <span className="font-medium text-gray-700">{template.savings}</span>
              </div>

              <div className="mt-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gray-400">Included modules</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {template.modules.map((module) => (
                    <Badge key={module} variant="neutral">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
                  onClick={() => {
                    setToastMessage(`Applied ${template.title}.`);
                    setToastOpen(true);
                  }}
                  type="button"
                >
                  Apply Template
                </button>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onClick={() => {
                    setToastMessage(`${template.title} details opened.`);
                    setToastOpen(true);
                  }}
                  type="button"
                >
                  <TemplateIcon kind="send" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-gray-200 bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.32),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(224,231,255,0.35),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)] shadow-sm">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-100">
            <TemplateIcon kind="gift" />
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-gray-950">Need something custom built?</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            Our AI Solution Architects can help you build a specialized workflow tailored specifically to your
            business operations. Free consultation included with all Enterprise plans.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              className="inline-flex items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
              onClick={() => {
                setToastMessage("Specialist consult requested.");
                setToastOpen(true);
              }}
              type="button"
            >
              Speak to an AI Specialist
            </button>
            <button
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => {
                setToastMessage("Custom case studies opened.");
                setToastOpen(true);
              }}
              type="button"
            >
              View Custom Case Studies
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
