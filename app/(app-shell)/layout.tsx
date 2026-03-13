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

type NavItem = {
  href: string;
  label: string;
  icon: string;
  featureKey?: FeatureKey;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "[DB]" },
  { href: "/customer-service", label: "Customer Service", icon: "[CS]" },
  { href: "/chatbot-config", label: "Chatbot Config", icon: "[CB]" },
  { href: "/integrations", label: "Integrations", icon: "[IG]" },
  { href: "/insights", label: "AI Insights", icon: "[AI]" },
  { href: "/analytics", label: "Analytics", icon: "[AN]" },
];

type SearchResult = {
  id: string;
  label: string;
  description: string;
  href: string;
  section: "Navigation" | "Conversations";
  featureKey?: FeatureKey;
};

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

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const navigationResults: SearchResult[] = navItems.map((item) => ({
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

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-200 bg-white p-4 transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 text-lg font-semibold">AccessPath Admin</div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const locked = item.featureKey ? !hasFeatureAccess(session, item.featureKey) : false;
            const featureKey = item.featureKey;
            return (
              locked ? (
                <button
                  aria-disabled="true"
                  key={item.href}
                  className="flex w-full items-center justify-between rounded-md border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-500 outline-none transition hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onClick={() => {
                    if (featureKey) handleLockedFeature(featureKey);
                  }}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-base leading-none">
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  <span className="text-xs uppercase tracking-wide">
                    {featureKey
                      ? featureRequirements[featureKey].plan ?? featureRequirements[featureKey].role
                      : ""}
                  </span>
                </button>
              ) : (
              <Link
                aria-current={active ? "page" : undefined}
                key={item.href}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
                  active
                    ? "border-gray-900 bg-gray-900 font-medium text-white"
                    : "border-transparent text-gray-700 hover:bg-gray-100"
                }`}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    {item.icon}
                  </span>
                  {item.label}
              </Link>
              )
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-gray-200 bg-white px-4">
          <button
            aria-label="Toggle sidebar"
            className="rounded-md border border-gray-300 px-2 py-1 text-sm outline-none transition hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 lg:hidden"
            onClick={() => setSidebarOpen((open) => !open)}
            type="button"
          >
            Menu
          </button>
          <div className="ml-3 text-sm text-gray-600">AccessPath MVP</div>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={resetDemoData}
              type="button"
            >
              Reset Demo Data
            </button>
            <select
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
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
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
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
            className="ml-2 flex min-w-52 items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            onClick={() => {
              setActiveIndex(0);
              setCommandOpen(true);
            }}
            type="button"
          >
            <span>Search or jump...</span>
            <span className="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-400">
              Ctrl+K
            </span>
          </button>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
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
