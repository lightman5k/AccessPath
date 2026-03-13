"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge, EmptyState, PageHeader, Table } from "@/components/ui";
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
    <div className="space-y-6">
      <PageHeader
        title="Customer Service"
        description="Track service queues, team responsiveness, and live conversations."
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {customerServiceKpis.map((kpi) => (
          <article
            key={kpi.label}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <p className="text-sm text-gray-500">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold">{kpi.value}</p>
            <p className="mt-1 text-sm text-gray-600">{kpi.note}</p>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-gray-200 bg-white p-4 xl:col-span-1">
          <h2 className="text-lg font-semibold">Queue</h2>
          <ul className="mt-4 space-y-3">
            {customerServiceQueueItems.map((item) => (
              <li
                key={item.priority}
                className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.priority}</p>
                  <p className="text-xs text-gray-600">Target: {item.eta}</p>
                </div>
                <Badge variant={badgeMetaForPriority(item.priority).variant}>
                  {item.count}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 xl:col-span-2">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <p className="text-sm text-gray-500">
              {filteredConversations.length} result
              {filteredConversations.length === 1 ? "" : "s"}
            </p>
          </header>
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
