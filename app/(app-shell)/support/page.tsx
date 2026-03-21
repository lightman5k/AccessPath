"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Toast } from "@/components/ui";

type SupportTopic = {
  id: string;
  title: string;
  articles: number;
};

type OnboardingPath = {
  id: string;
  title: string;
  description: string;
  progress: number;
  steps: string[];
};

type VideoItem = {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  palette: string;
};

const popularTopics = [
  "Setting up workflows",
  "Connecting APIs",
  "Billing cycles",
  "AI customization",
];

const onboardingPaths: OnboardingPath[] = [
  {
    id: "owners",
    title: "Quick Start for Owners",
    description:
      "Establish your core business rules and connect your primary sales channels.",
    progress: 60,
    steps: ["Connect Payment Provider", "Review Business Policy", "Invite Team Members", "Configure Tax Rules"],
  },
  {
    id: "automation",
    title: "Automation Masterclass",
    description:
      "Learn how to build complex logistics and customer service workflows from scratch.",
    progress: 20,
    steps: ["Review Checklist Setup", "Create Routing Rules", "Inventory Alerts", "AI Response Templates"],
  },
  {
    id: "analytics",
    title: "Analytics Power User",
    description:
      "Deep dive into ROI tracking, custom reporting, and predictive growth insights.",
    progress: 0,
    steps: ["Dashboard Customization", "Exporting CSV Data", "Goal Setting", "Predictive Forecasting"],
  },
];

const knowledgeTopics: SupportTopic[] = [
  { id: "getting-started", title: "Getting Started", articles: 12 },
  { id: "workflow-builder", title: "Workflow Builder", articles: 24 },
  { id: "logistics", title: "Logistics Optimization", articles: 18 },
  { id: "customer-service", title: "Customer Service", articles: 15 },
  { id: "inventory", title: "Inventory & Stock", articles: 10 },
  { id: "billing", title: "Account & Billing", articles: 8 },
  { id: "integrations", title: "App Integrations", articles: 21 },
  { id: "security", title: "Security & Privacy", articles: 9 },
];

const videoItems: VideoItem[] = [
  {
    id: "shopify",
    title: "Connecting AccessPath to Shopify",
    subtitle: "In 2 Minutes",
    duration: "05:14",
    palette: "from-sky-500 to-blue-700",
  },
  {
    id: "workflow",
    title: "Advanced Logic in Workflow Builder",
    subtitle: "Power User Guide",
    duration: "10:53",
    palette: "from-slate-500 to-slate-700",
  },
  {
    id: "customer-ai",
    title: "Setting Up Your First AI Customer Agent",
    subtitle: "Launch Checklist",
    duration: "07:28",
    palette: "from-emerald-400 to-teal-600",
  },
  {
    id: "roi",
    title: "Understanding Your ROI Dashboard",
    subtitle: "Reporting Overview",
    duration: "06:42",
    palette: "from-amber-400 to-orange-500",
  },
];

function SupportIcon({
  kind,
}: {
  kind: "star" | "search" | "book" | "play" | "community" | "feature" | "chat" | "send";
}) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (kind === "star") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
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

  if (kind === "book") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M5 5h5v14H5z" />
        <path d="M10 5h9v14h-9" />
      </svg>
    );
  }

  if (kind === "play") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="m10 9 5 3-5 3V9z" />
      </svg>
    );
  }

  if (kind === "community") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <circle cx="8" cy="9" r="3" />
        <circle cx="17" cy="8" r="2.5" />
        <path d="M3 19c0-3 2.5-5 5-5s5 2 5 5" />
        <path d="M14 18c.5-2.2 2.3-3.5 4.5-3.5 1.1 0 2.2.3 3 .9" />
      </svg>
    );
  }

  if (kind === "feature") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 3v18" />
        <path d="M17 7.5c0-1.7-2.2-3-5-3s-5 1.3-5 3 2 2.6 5 3 5 1.3 5 3-2.2 3-5 3-5-1.3-5-3" />
      </svg>
    );
  }

  if (kind === "chat") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M6 18l-2 2V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6z" />
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

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return knowledgeTopics;
    return knowledgeTopics.filter((topic) =>
      `${topic.title} ${topic.articles}`.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const filteredVideos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return videoItems;
    return videoItems.filter((video) =>
      `${video.title} ${video.subtitle}`.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  return (
    <div className="space-y-8">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <Card className="border-sky-100 bg-[linear-gradient(180deg,#eef6ff_0%,#f8fbff_100%)] shadow-sm">
        <div className="mx-auto max-w-4xl py-6 text-center">
          <Badge variant="info" className="px-3 py-1">
            <span className="mr-2 inline-flex align-middle">
              <SupportIcon kind="star" />
            </span>
            Support Training Hub
          </Badge>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-gray-950">
            How can we help you grow today?
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-600">
            Search our comprehensive library of guides, tutorials, and technical documentation
            to master the AccessPath platform.
          </p>

          <div className="mx-auto mt-6 flex max-w-2xl items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-gray-400">
              <SupportIcon kind="search" />
            </span>
            <input
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Ask a question or search keywords (e.g. Shopify integration, refund policy...)"
              type="text"
              value={searchQuery}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
            <span className="font-medium">Popular topics:</span>
            {popularTopics.map((topic, index) => (
              <span key={topic}>
                {topic}
                {index < popularTopics.length - 1 ? " • " : ""}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <Card className="border-sky-200 bg-gradient-to-r from-sky-50 to-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
              <SupportIcon kind="star" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-950">Interactive AI Concierge</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-600">
                Need instant help? Our specialized AI is trained on every AccessPath feature. It can
                show you exactly where a button is or draft an automation rule for you.
              </p>
            </div>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
            onClick={() => {
              setToastMessage("AI support chat started.");
              setToastOpen(true);
            }}
            type="button"
          >
            <SupportIcon kind="chat" />
            Start AI Chat
          </button>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950">Recommended Onboarding</h2>
            <p className="mt-1 text-sm text-gray-600">Tailored pathways to get you up to speed quickly.</p>
          </div>
          <button
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            onClick={() => {
              setToastMessage("Viewing all onboarding paths.");
              setToastOpen(true);
            }}
            type="button"
          >
            View All Paths
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {onboardingPaths.map((path) => (
            <Card key={path.id} className="border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <SupportIcon kind="star" />
                </span>
                <Badge variant="neutral">{path.progress}%</Badge>
              </div>

              <h3 className="mt-4 text-lg font-semibold tracking-tight text-gray-950">{path.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{path.description}</p>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span className="font-medium text-gray-700">{path.progress}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                    style={{ width: `${path.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {path.steps.map((step) => (
                  <div key={step} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-[0.65rem] text-gray-500">
                      ○
                    </span>
                    {step}
                  </div>
                ))}
              </div>

              <button
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-sky-700 transition hover:text-sky-800"
                onClick={() => {
                  setToastMessage(`Continuing ${path.title}.`);
                  setToastOpen(true);
                }}
                type="button"
              >
                Continue Pathway
                <SupportIcon kind="send" />
              </button>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-950">Knowledge Base</h2>
          <p className="mt-1 text-sm text-gray-600">Browse by product area and core operations topic.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredTopics.map((topic) => (
            <Card key={topic.id} className="border-gray-200 bg-white shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-700">
                <SupportIcon kind="book" />
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-gray-950">{topic.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{topic.articles} articles</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950">Video Tutorials</h2>
            <p className="mt-1 text-sm text-gray-600">Watch and learn with step-by-step walkthroughs.</p>
          </div>
          <button
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            onClick={() => {
              setToastMessage("Opening YouTube channel.");
              setToastOpen(true);
            }}
            type="button"
          >
            YouTube Channel
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="border-gray-200 bg-white p-0 shadow-sm">
              <div className={`relative h-40 rounded-t-lg bg-gradient-to-br ${video.palette}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_35%)]" />
                <div className="absolute right-3 top-3 rounded-md bg-black/55 px-2 py-1 text-[0.68rem] font-medium text-white">
                  {video.duration}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-sm">
                    <SupportIcon kind="play" />
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-950">{video.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{video.subtitle}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border-gray-200 bg-white shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <SupportIcon kind="feature" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-gray-950">Request a Feature</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            Missing a specific tool? We’re building AccessPath for you. Join our roadmap discussion
            and tell us what automation you need next.
          </p>
          <button
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-sky-700 transition hover:text-sky-800"
            onClick={() => {
              setToastMessage("Opening product roadmap.");
              setToastOpen(true);
            }}
            type="button"
          >
            View Product Roadmap
            <SupportIcon kind="send" />
          </button>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <SupportIcon kind="community" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-gray-950">AccessPath Community</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            Connect with thousands of other U.S. small business owners. Share your custom workflows
            and learn best practices for scaling.
          </p>
          <button
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-sky-700 transition hover:text-sky-800"
            onClick={() => {
              setToastMessage("Opening community discussion.");
              setToastOpen(true);
            }}
            type="button"
          >
            Join the Discussion
            <SupportIcon kind="send" />
          </button>
        </Card>
      </section>
    </div>
  );
}
