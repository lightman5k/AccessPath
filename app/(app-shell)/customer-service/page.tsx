"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge, EmptyState, PageHeader, StatCard, Table } from "@/components/ui";
import {
  customerServiceConversations,
  customerServiceKpis,
  customerServiceQueueItems,
} from "@/lib/mock";
import {
  badgeMetaForPriority,
  badgeMetaForStatus,
  readCustomerServiceConversationOverrides,
} from "@/lib";
import { demoDataResetEvent } from "@/lib/mock";
import type { ConversationListItem } from "@/types";

type ConversationTab = "all" | "high" | "assigned" | "resolved";
type SortKey = "newest" | "priority" | "status";

const tabOptions: Array<{ key: ConversationTab; label: string }> = [
  { key: "all", label: "All" },
  { key: "high", label: "High Priority" },
  { key: "assigned", label: "Assigned" },
  { key: "resolved", label: "Resolved" },
];

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: "newest", label: "Newest First" },
  { key: "priority", label: "Priority" },
  { key: "status", label: "Status" },
];

const priorityRank: Record<ConversationListItem["priority"], number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

const statusRank: Record<ConversationListItem["status"], number> = {
  Escalated: 0,
  Open: 1,
  "In Progress": 2,
  Resolved: 3,
};

function minutesSinceIso(value: string): number {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, Math.floor((Date.now() - ms) / 60_000));
}

function formatIsoAsAgo(value: string): string {
  const minutes = minutesSinceIso(value);
  if (minutes === Number.MAX_SAFE_INTEGER) return value;
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function sanitizeTab(value: string | null): ConversationTab {
  if (value === "high" || value === "assigned" || value === "resolved") {
    return value;
  }
  return "all";
}

function sanitizeSort(value: string | null): SortKey {
  if (value === "priority" || value === "status") return value;
  return "newest";
}

export default function CustomerServicePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = sanitizeTab(searchParams.get("tab"));
  const searchQuery = searchParams.get("q") ?? "";
  const sortKey = sanitizeSort(searchParams.get("sort"));
  const [conversationOverrides, setConversationOverrides] = useState(
    () => ({} as ReturnType<typeof readCustomerServiceConversationOverrides>),
  );

  useEffect(() => {
    const hydrateOverrides = () => {
      setConversationOverrides(readCustomerServiceConversationOverrides());
    };

    hydrateOverrides();
    window.addEventListener(demoDataResetEvent, hydrateOverrides);
    return () => window.removeEventListener(demoDataResetEvent, hydrateOverrides);
  }, []);

  const mergedConversations = useMemo(() => {
    return customerServiceConversations.map((row) => {
      const override = conversationOverrides[row.id];
      if (!override) return { ...row, hasHandoffTicket: false };

      return {
        ...row,
        status: override.status ?? row.status,
        assignee: override.assignee ?? row.assignee,
        priority: override.priority ?? row.priority,
        updated: override.updatedAt ?? row.updated,
        hasHandoffTicket: override.hasHandoffTicket ?? false,
      };
    });
  }, [conversationOverrides]);

  const updateQuery = (next: { tab?: ConversationTab; q?: string; sort?: SortKey }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (next.tab !== undefined) {
      if (next.tab === "all") params.delete("tab");
      else params.set("tab", next.tab);
    }

    if (next.q !== undefined) {
      if (next.q.trim()) params.set("q", next.q);
      else params.delete("q");
    }

    if (next.sort !== undefined) {
      if (next.sort === "newest") params.delete("sort");
      else params.set("sort", next.sort);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = mergedConversations.filter((row) => {
      if (activeTab === "high" && row.priority !== "High") return false;
      if (activeTab === "assigned" && row.assignee === "Unassigned") return false;
      if (activeTab === "resolved" && row.status !== "Resolved") return false;

      if (!query) return true;

      return (
        row.customer.toLowerCase().includes(query) ||
        row.topic.toLowerCase().includes(query) ||
        row.preview.toLowerCase().includes(query)
      );
    });

    return filtered.sort((a, b) => {
      if (sortKey === "priority") {
        const diff = priorityRank[a.priority] - priorityRank[b.priority];
        return diff !== 0 ? diff : minutesSinceIso(a.updated) - minutesSinceIso(b.updated);
      }
      if (sortKey === "status") {
        const diff = statusRank[a.status] - statusRank[b.status];
        return diff !== 0 ? diff : minutesSinceIso(a.updated) - minutesSinceIso(b.updated);
      }
      return minutesSinceIso(a.updated) - minutesSinceIso(b.updated);
    });
  }, [activeTab, mergedConversations, searchQuery, sortKey]);

  const tableRows = filteredConversations.map((row) => ({
    key: row.id,
    className: "hover:bg-gray-50",
    cells: [
      <Link
        key={`${row.id}-id`}
        href={`/customer-service/${row.id}`}
        className="font-medium text-gray-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
      >
        {row.id}
      </Link>,
      <Link
        key={`${row.id}-customer`}
        href={`/customer-service/${row.id}`}
        className="text-gray-800 hover:underline"
      >
        {row.customer}
      </Link>,
      <Link key={`${row.id}-channel`} href={`/customer-service/${row.id}`} className="text-gray-600">
        {row.channel}
      </Link>,
      <Link key={`${row.id}-topic`} href={`/customer-service/${row.id}`} className="text-gray-600">
        {row.topic}
      </Link>,
      <Link key={`${row.id}-assignee`} href={`/customer-service/${row.id}`} className="text-gray-600">
        {row.assignee}
      </Link>,
      <Badge key={`${row.id}-priority`} variant={badgeMetaForPriority(row.priority).variant}>
        {badgeMetaForPriority(row.priority).label}
      </Badge>,
      <Badge key={`${row.id}-status`} variant={badgeMetaForStatus(row.status).variant}>
        {badgeMetaForStatus(row.status).label}
      </Badge>,
      row.hasHandoffTicket ? (
        <Badge key={`${row.id}-handoff`} className="ml-2" variant="info">
          Handoff
        </Badge>
      ) : (
        ""
      ),
      <Link key={`${row.id}-updated`} href={`/customer-service/${row.id}`} className="text-gray-500">
        {formatIsoAsAgo(row.updated)}
      </Link>,
    ],
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Customer Support Hub"
        description="Manage support tickets, monitor team performance, and resolve customer inquiries efficiently."
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {customerServiceKpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            helperText={kpi.note}
          />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-gray-200 bg-white p-6 xl:col-span-1">
          <header className="mb-6">
            <h2 className="text-lg font-semibold">Support Queue</h2>
            <p className="mt-1 text-sm text-gray-600">Active conversations by priority</p>
          </header>
          <div className="space-y-4">
            {customerServiceQueueItems.map((item) => (
              <div
                key={item.priority}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4 transition-colors hover:from-gray-100 hover:to-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${
                    item.priority === 'High' ? 'bg-red-500' :
                    item.priority === 'Medium' ? 'bg-amber-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.priority} Priority</p>
                    <p className="text-xs text-gray-600">Target: {item.eta}</p>
                  </div>
                </div>
                <Badge
                  variant={badgeMetaForPriority(item.priority).variant}
                  className="text-sm font-semibold"
                >
                  {item.count}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Total active:</span> {customerServiceQueueItems.reduce((sum, item) => sum + item.count, 0)} conversations
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 xl:col-span-2">
          <header className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <p className="text-sm text-gray-500">
              {filteredConversations.length} result
              {filteredConversations.length === 1 ? "" : "s"}
            </p>
          </header>

          <div className="mb-6 flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              type="button"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Conversation
            </button>
            <button
              className="flex items-center gap-2 rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              type="button"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Bulk Resolve
            </button>
            <button
              className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              type="button"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Reassign Queue
            </button>
          </div>

          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabOptions.map((tab) => {
                const active = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    className={`rounded-md border px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => updateQuery({ tab: tab.key })}
                    type="button"
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="flex w-full gap-2 md:w-auto">
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onChange={(event) => updateQuery({ sort: sanitizeSort(event.target.value) })}
                value={sortKey}
              >
                {sortOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="conversation-search">
                Search conversations
              </label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 md:w-72"
                id="conversation-search"
                onChange={(event) => updateQuery({ q: event.target.value })}
                placeholder="Search customer, topic, or preview"
                type="search"
                value={searchQuery}
              />
            </div>
          </div>
          {tableRows.length > 0 ? (
            <Table
              ariaLabel="Customer service conversations"
              columns={[
                { key: "id", header: "ID" },
                { key: "customer", header: "Customer" },
                { key: "channel", header: "Channel" },
                { key: "topic", header: "Topic" },
                { key: "assignee", header: "Assignee" },
                { key: "priority", header: "Priority" },
                { key: "status", header: "Status" },
                { key: "handoff", header: "Handoff" },
                { key: "updated", header: "Updated" },
              ]}
              rows={tableRows}
            />
          ) : (
            <EmptyState
              description="Try a different tab, search term, or sort option."
              title="No conversations match your filters"
            />
          )}
        </section>
      </div>
    </div>
  );
}
