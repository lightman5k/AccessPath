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

function getCategoryFromTopic(topic: string): string {
  const lowerTopic = topic.toLowerCase();
  if (lowerTopic.includes('delivery') || lowerTopic.includes('shipment')) return 'Logistics';
  if (lowerTopic.includes('invoice') || lowerTopic.includes('payment')) return 'Billing';
  if (lowerTopic.includes('api') || lowerTopic.includes('workflow')) return 'Technical';
  if (lowerTopic.includes('inventory') || lowerTopic.includes('stock')) return 'Inventory';
  return 'General';
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
    className: "hover:bg-blue-50/50 border-b border-gray-100 transition-colors",
    cells: [
      <div key={`${row.id}-id`} className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${
          row.status === 'Open' ? 'bg-green-500' :
          row.status === 'In Progress' ? 'bg-blue-500' :
          row.status === 'Escalated' ? 'bg-red-500' : 'bg-gray-500'
        }`} />
        <Link
          href={`/customer-service/${row.id}`}
          className="font-medium text-gray-900 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {row.id}
        </Link>
      </div>,
      <Link
        key={`${row.id}-customer`}
        href={`/customer-service/${row.id}`}
        className="text-gray-800 hover:text-blue-600 font-medium"
      >
        {row.customer}
      </Link>,
      <span key={`${row.id}-channel`} className="text-gray-600 text-sm">
        {row.channel}
      </span>,
      <div key={`${row.id}-topic`} className="flex flex-col gap-1">
        <span className="text-gray-700 text-sm max-w-xs truncate font-medium">
          {row.topic}
        </span>
        <Badge variant="neutral" className="text-xs w-fit">
          {getCategoryFromTopic(row.topic)}
        </Badge>
      </div>,
      <span key={`${row.id}-assignee`} className="text-gray-600 text-sm">
        {row.assignee}
      </span>,
      <Badge
        key={`${row.id}-priority`}
        variant={badgeMetaForPriority(row.priority).variant}
        className="font-medium"
      >
        {row.priority}
      </Badge>,
      <div key={`${row.id}-status`} className="flex items-center gap-2">
        <Badge
          variant={badgeMetaForStatus(row.status).variant}
          className="font-medium"
        >
          {badgeMetaForStatus(row.status).label}
        </Badge>
        {row.hasHandoffTicket && (
          <Badge variant="info" className="text-xs">
            Handoff
          </Badge>
        )}
      </div>,
      <span key={`${row.id}-updated`} className="text-gray-500 text-sm">
        {formatIsoAsAgo(row.updated)}
      </span>,
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
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
              <p className="mt-1 text-sm text-gray-600">
                {filteredConversations.length} ticket{filteredConversations.length === 1 ? "" : "s"} found
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Live updates
            </div>
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
              ariaLabel="Customer support tickets"
              columns={[
                { key: "id", header: "Ticket ID", className: "w-32" },
                { key: "customer", header: "Customer", className: "w-40" },
                { key: "channel", header: "Channel", className: "w-24" },
                { key: "topic", header: "Issue & Category", className: "min-w-48" },
                { key: "assignee", header: "Assignee", className: "w-32" },
                { key: "priority", header: "Priority", className: "w-24" },
                { key: "status", header: "Status", className: "w-40" },
                { key: "updated", header: "Last Updated", className: "w-28" },
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
