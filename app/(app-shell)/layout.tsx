"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Modal, Toast } from "@/components/ui";
import {
  customerServiceConversations,
  demoDataResetEvent,
  featureRequirements,
  hasFeatureAccess,
  resetDemoData,
  saveMockSession,
  useMockSession,
} from "@/lib/mock";
import type { FeatureKey, MockPlan, MockRole } from "@/types";

type SidebarIconName =
  | "dashboard"
  | "customer-service"
  | "workflow-builder"
  | "logistics"
  | "inventory"
  | "analytics"
  | "insights"
  | "chatbot-config"
  | "collaboration"
  | "templates"
  | "integrations"
  | "security"
  | "support"
  | "settings"
  | "logout";

type NavItem = {
  label: string;
  icon: SidebarIconName;
  href?: string;
  featureKey?: FeatureKey;
  placeholder?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type RouteNavItem = NavItem & {
  href: string;
};

const navSections: NavSection[] = [
  {
    title: "Operation Centers",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/customer-service", label: "Customer Service", icon: "customer-service" },
      {
        href: "/workflow-builder",
        label: "Workflow Builder",
        icon: "workflow-builder",
        featureKey: "workflowBuilder",
      },
      { href: "/logistics", label: "Logistics", icon: "logistics" },
      { href: "/inventory", label: "Inventory", icon: "inventory" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/analytics", label: "Analytics", icon: "analytics" },
      { href: "/insights", label: "AI Insights", icon: "insights" },
      { href: "/chatbot-config", label: "Chatbot Config", icon: "chatbot-config" },
      { href: "/collaboration", label: "Collaboration", icon: "collaboration" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/templates", label: "Templates", icon: "templates" },
      { href: "/integrations", label: "Integrations", icon: "integrations" },
      { href: "/security", label: "Security", icon: "security" },
      { href: "/support", label: "Support", icon: "support" },
    ],
  },
];

type SearchResult = {
  id: string;
  label: string;
  description: string;
  href: string;
  section: "Navigation" | "Conversations";
  featureKey?: FeatureKey;
};

function SidebarIcon({
  active = false,
  className = "h-5 w-5",
  name,
}: {
  active?: boolean;
  className?: string;
  name: SidebarIconName;
}) {
  const stroke = active ? 2 : 1.9;

  switch (name) {
    case "dashboard":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </svg>
      );
    case "customer-service":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <path d="M6 18l-2 2V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6z" />
        </svg>
      );
    case "workflow-builder":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="12" r="2" />
          <circle cx="8" cy="18" r="2" />
          <path d="M8 8l8 3" />
          <path d="M7 8l1 8" />
        </svg>
      );
    case "logistics":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <path d="M3 8h11v8H3z" />
          <path d="M14 11h3l3 3v2h-6z" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      );
    case "inventory":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <path d="M12 3l8 4.5v9L12 21 4 16.5v-9L12 3z" />
          <path d="M12 12l8-4.5" />
          <path d="M12 12v9" />
          <path d="M12 12L4 7.5" />
        </svg>
      );
    case "analytics":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-6" />
          <path d="M22 20H2" />
        </svg>
      );
    case "insights":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
          <path d="M5 16l.9 2.1L8 19l-2.1.9L5 22l-.9-2.1L2 19l2.1-.9L5 16z" />
        </svg>
      );
    case "chatbot-config":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <rect x="4" y="5" width="16" height="12" rx="4" />
          <path d="M9 10h6" />
          <path d="M12 17v3" />
        </svg>
      );
    case "collaboration":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <circle cx="8" cy="9" r="3" />
          <circle cx="17" cy="8" r="2.5" />
          <path d="M3 19c0-3 2.5-5 5-5s5 2 5 5" />
          <path d="M14 18c.5-2.2 2.3-3.5 4.5-3.5 1.1 0 2.2.3 3 .9" />
        </svg>
      );
    case "templates":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <path d="M4 7h16" />
          <path d="M8 3v8" />
          <path d="M16 13v8" />
          <path d="M4 17h16" />
        </svg>
      );
    case "integrations":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <path d="M9 8l3-3 3 3" />
          <path d="M9 16l3 3 3-3" />
          <path d="M12 5v5" />
          <path d="M12 14v5" />
          <path d="M7 12H4" />
          <path d="M20 12h-3" />
        </svg>
      );
    case "security":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
          <path d="M9.5 12.5l1.7 1.7 3.8-4.2" />
        </svg>
      );
    case "support":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 4.1 2c-.9.7-1.6 1.3-1.6 2.5" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "settings":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z" />
        </svg>
      );
    case "logout":
      return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} viewBox="0 0 24 24">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
  }
}

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useMockSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [lockedFeature, setLockedFeature] = useState<FeatureKey | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  const routeNavItems = useMemo(
    () =>
      navSections
        .flatMap((section) => section.items)
        .filter((item): item is RouteNavItem => typeof item.href === "string"),
    [],
  );

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const navigationResults: SearchResult[] = routeNavItems.map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      description: item.href,
      href: item.href,
      section: "Navigation",
      featureKey: item.featureKey,
    }));

    const conversationResults: SearchResult[] = customerServiceConversations.map((conversation) => ({
      id: `conversation-${conversation.id}`,
      label: conversation.customer,
      description: `${conversation.id} - ${conversation.topic}`,
      href: `/customer-service/${conversation.id}`,
      section: "Conversations",
    }));

    const combined = [...navigationResults, ...conversationResults];
    if (!query) return combined;

    return combined.filter((result) => {
      const haystack = `${result.label} ${result.description} ${result.href}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [searchQuery]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setActiveIndex(0);
        setCommandOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  useEffect(() => {
    const handleDemoReset = () => {
      setToastMessage("Demo data reset.");
      setToastOpen(true);
    };

    window.addEventListener(demoDataResetEvent, handleDemoReset);
    return () => window.removeEventListener(demoDataResetEvent, handleDemoReset);
  }, []);

  const closeCommand = () => {
    setCommandOpen(false);
    setSearchQuery("");
    setActiveIndex(0);
  };

  const resolvedActiveIndex =
    searchResults.length === 0 ? 0 : Math.min(activeIndex, searchResults.length - 1);

  const goToResult = (href: string) => {
    router.push(href);
    closeCommand();
  };

  const handleLockedFeature = (featureKey: FeatureKey) => {
    setLockedFeature(featureKey);
  };

  const applyMockUpgrade = () => {
    if (!lockedFeature) return;
    const requirement = featureRequirements[lockedFeature];
    const nextSession = {
      plan: requirement.plan ?? session.plan,
      role: requirement.role ?? session.role,
    };
    saveMockSession(nextSession);
    setLockedFeature(null);
    setToastMessage(
      requirement.plan
        ? `Mock plan switched to ${requirement.plan}.`
        : `Mock role switched to ${requirement.role}.`,
    );
    setToastOpen(true);
  };

  const planLabel = session.plan.charAt(0).toUpperCase() + session.plan.slice(1);
  const roleLabel = session.role === "admin" ? "Admin" : "Agent";
  const roleInitials = session.role === "admin" ? "AD" : "AG";

  const renderSidebarItem = (item: NavItem) => {
    const active = item.href
      ? pathname === item.href || pathname.startsWith(`${item.href}/`)
      : false;
    const locked = item.featureKey ? !hasFeatureAccess(session, item.featureKey) : false;
    const commonClasses =
      "group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[0.89rem] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2";

    if (locked) {
      return (
        <button
          aria-disabled="true"
          className={`${commonClasses} border border-dashed border-slate-300 bg-white/60 text-slate-500 hover:bg-white`}
          key={item.label}
          onClick={() => item.featureKey && handleLockedFeature(item.featureKey)}
          type="button"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
              <SidebarIcon className="h-4 w-4" name={item.icon} />
            </span>
            <span>{item.label}</span>
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.14em] text-slate-500">
            {item.featureKey ? featureRequirements[item.featureKey].plan ?? featureRequirements[item.featureKey].role : ""}
          </span>
        </button>
      );
    }

    if (item.placeholder) {
      return (
        <button
          className={`${commonClasses} text-slate-600 hover:bg-white/85`}
          key={item.label}
          onClick={() => {
            setToastMessage(`${item.label} is a placeholder module for the demo.`);
            setToastOpen(true);
            setSidebarOpen(false);
          }}
          type="button"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm ring-1 ring-slate-200">
              <SidebarIcon className="h-4 w-4" name={item.icon} />
            </span>
            <span>{item.label}</span>
          </span>
        </button>
      );
    }

    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={`${commonClasses} ${
          active
            ? "bg-sky-600 text-white shadow-[0_10px_24px_rgba(2,132,199,0.28)]"
            : "text-slate-700 hover:bg-white/85"
        }`}
        href={item.href ?? "/dashboard"}
        key={item.label}
        onClick={() => setSidebarOpen(false)}
      >
        <span className="flex items-center gap-2.5">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              active
                ? "bg-white/16 text-white ring-1 ring-white/20"
                : "bg-white/90 text-slate-500 shadow-sm ring-1 ring-slate-200"
            }`}
          >
            <SidebarIcon active={active} className="h-4 w-4" name={item.icon} />
          </span>
          <span>{item.label}</span>
        </span>
        {active ? (
          <svg
            aria-hidden="true"
            className="h-4 w-4 text-white"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        ) : null}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />
      {sidebarOpen ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/92 backdrop-blur">
        <div className="flex h-16 items-center">
          <div className="hidden w-[15.5rem] items-center px-3.5 lg:flex">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-[0_10px_24px_rgba(2,132,199,0.28)]">
                <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 12h4l2-5 4 10 2-5h6" />
                </svg>
              </div>
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">AccessPath</p>
                <p className="text-[1.05rem] font-semibold tracking-tight text-sky-700">for Business</p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-3 px-4 lg:px-6">
            <button
              aria-label="Toggle sidebar"
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 lg:hidden"
              onClick={() => setSidebarOpen((open) => !open)}
              type="button"
            >
              Menu
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-[0_10px_24px_rgba(2,132,199,0.28)]">
                <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 12h4l2-5 4 10 2-5h6" />
                </svg>
              </div>
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">AccessPath</p>
                <p className="text-[1.05rem] font-semibold tracking-tight text-sky-700">for Business</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden xl:flex items-center gap-2">
                <button
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                  onClick={resetDemoData}
                  type="button"
                >
                  Reset Demo Data
                </button>
                <select
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                  onChange={(event) =>
                    saveMockSession({
                      ...session,
                      plan: event.target.value as MockPlan,
                    })
                  }
                  value={session.plan}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
                <select
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                  onChange={(event) =>
                    saveMockSession({
                      ...session,
                      role: event.target.value as MockRole,
                    })
                  }
                  value={session.role}
                >
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              <button
                className="hidden min-w-[260px] items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 md:flex"
                onClick={() => {
                  setActiveIndex(0);
                  setCommandOpen(true);
                }}
                type="button"
              >
                <span className="flex items-center gap-2.5">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                  <span>Search insights...</span>
                </span>
                <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[0.68rem] font-medium text-slate-400">
                  Ctrl+K
                </span>
              </button>

              <button
                aria-label="Open search"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 md:hidden"
                onClick={() => {
                  setActiveIndex(0);
                  setCommandOpen(true);
                }}
                type="button"
              >
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
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </button>

              <button
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                type="button"
              >
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
                  <path d="M6 8a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
                  <path d="M10 19a2 2 0 0 0 4 0" />
                </svg>
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500" />
              </button>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
                <div className="hidden text-right lg:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {planLabel}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-700">{roleLabel}</p>
                </div>
                <div className="relative">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-xs font-semibold text-white">
                    {roleInitials}
                  </span>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <aside
        className={`fixed bottom-0 left-0 top-16 z-40 w-[15.5rem] bg-[#edf5ff] transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200">
            <div className="flex-1 overflow-y-auto px-2.5 py-4">
              <div className="space-y-5">
                {navSections.map((section) => (
                  <div key={section.title}>
                    <p className="px-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {section.title}
                    </p>
                    <nav className="mt-2 space-y-0.5">
                      {section.items.map((item) => renderSidebarItem(item))}
                    </nav>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white/45 px-2.5 py-2.5">
              <div className="space-y-0.5">
                {renderSidebarItem({ href: "/settings", label: "Settings", icon: "settings" })}
                <button
                  className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[0.89rem] font-medium text-rose-600 outline-none transition hover:bg-white/85 focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2"
                  onClick={() => {
                    setToastMessage("Logged out of the demo session.");
                    setToastOpen(true);
                    setSidebarOpen(false);
                    router.push("/login");
                  }}
                  type="button"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-rose-500 shadow-sm ring-1 ring-slate-200">
                    <SidebarIcon className="h-4 w-4" name="logout" />
                  </span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="pt-16 lg:pl-[15.5rem]">
        <main className="px-4 pb-4 pt-3 lg:px-6 lg:pb-6 lg:pt-4">{children}</main>
      </div>

      <Modal
        open={commandOpen}
        title="Search"
        onClose={closeCommand}
      >
        <div className="space-y-3">
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((current) =>
                  searchResults.length === 0 ? 0 : Math.min(current + 1, searchResults.length - 1),
                );
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((current) => Math.max(current - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                const result = searchResults[resolvedActiveIndex];
                if (result?.featureKey && !hasFeatureAccess(session, result.featureKey)) {
                  handleLockedFeature(result.featureKey);
                  return;
                }
                if (result) goToResult(result.href);
              }
              if (event.key === "Escape") {
                event.preventDefault();
                closeCommand();
              }
            }}
            placeholder="Search pages, customers, topics, or conversation IDs"
            type="text"
            value={searchQuery}
          />

          {searchResults.length > 0 ? (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {searchResults.map((result, index) => {
                const active = index === resolvedActiveIndex;
                return (
                  <li key={result.id}>
                    <button
                      className={`w-full rounded-md border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        if (result.featureKey && !hasFeatureAccess(session, result.featureKey)) {
                          handleLockedFeature(result.featureKey);
                          return;
                        }
                        goToResult(result.href);
                      }}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{result.label}</p>
                          <p className={`mt-1 text-xs ${active ? "text-gray-200" : "text-gray-500"}`}>
                            {result.description}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            active ? "bg-white/20 text-white" : "bg-white text-gray-600"
                          }`}
                        >
                          {result.featureKey && !hasFeatureAccess(session, result.featureKey)
                            ? "Locked"
                            : result.section}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-center">
              <p className="text-sm font-medium text-gray-700">No results found</p>
              <p className="mt-1 text-sm text-gray-500">
                Try a page name, customer, topic, or conversation ID.
              </p>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        footer={
          <>
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => setLockedFeature(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-md border border-indigo-300 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
              onClick={applyMockUpgrade}
              type="button"
            >
              {lockedFeature && featureRequirements[lockedFeature].plan
                ? `Upgrade to ${featureRequirements[lockedFeature].plan}`
                : `Switch to ${lockedFeature ? featureRequirements[lockedFeature].role : "admin"}`}
            </button>
          </>
        }
        onClose={() => setLockedFeature(null)}
        open={lockedFeature !== null}
        title="Feature Locked"
      >
        <p className="text-sm text-gray-700">
          {lockedFeature ? featureRequirements[lockedFeature].description : ""}
        </p>
      </Modal>
    </div>
  );
}
