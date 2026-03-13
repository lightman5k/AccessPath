"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Modal, Toast } from "@/components/ui";
import {
  badgeVariantForPriority,
  badgeVariantForStatus,
  readCustomerServiceConversationState,
  writeCustomerServiceConversationState,
} from "@/lib";
import { demoDataResetEvent } from "@/lib/mock";
import type {
  ConversationDetail,
  ConversationLocalState,
  ConversationStatus,
  HandoffReason,
  HandoffTicket,
  QueuePriority,
  ConversationTimelineEntry,
} from "@/types";

type HandoffFormErrors = {
  reason?: string;
  priority?: string;
};

function initialTimeline(conversation: ConversationDetail): ConversationTimelineEntry[] {
  return [
    {
      id: `${conversation.id}-created`,
      time: new Date().toISOString(),
      text: `Conversation opened via ${conversation.channel}.`,
    },
    {
      id: `${conversation.id}-last-message`,
      time: new Date().toISOString(),
      text: "Latest customer update received.",
    },
  ];
}

function createLocalState(conversation: ConversationDetail): ConversationLocalState {
  return {
    status: conversation.status,
    assignee: conversation.assignee,
    priority: conversation.priority,
    notes: "",
    timeline: initialTimeline(conversation),
    handoffTicket: null,
    updatedAt: undefined,
  };
}

function dedupeHandoffTimeline(
  timeline: ConversationTimelineEntry[],
  ticket: HandoffTicket | null,
): ConversationTimelineEntry[] {
  if (!ticket) return timeline;
  const marker = `Handoff created: ${ticket.id}`;
  let seen = false;

  return timeline.filter((entry) => {
    if (!entry.text.includes(marker)) return true;
    if (seen) return false;
    seen = true;
    return true;
  });
}

function loadLocalState(conversation: ConversationDetail): ConversationLocalState {
  const stored = readCustomerServiceConversationState(conversation.id);
  if (!stored) return createLocalState(conversation);

  const persistedTicket = stored.handoffTicket;
  const baseTimeline =
    stored.timeline.length > 0 ? stored.timeline : initialTimeline(conversation);

  return {
    status: persistedTicket ? "Escalated" : stored.status ?? conversation.status,
    assignee: stored.assignee || conversation.assignee,
    priority: stored.priority ?? conversation.priority,
    notes: stored.notes ?? "",
    timeline: dedupeHandoffTimeline(baseTimeline, persistedTicket),
    handoffTicket: persistedTicket,
    updatedAt: stored.updatedAt,
  };
}

function addTimelineEntry(
  prev: ConversationTimelineEntry[],
  text: string,
): ConversationTimelineEntry[] {
  return [
    {
      id: `event-${Date.now()}`,
      time: new Date().toISOString(),
      text,
    },
    ...prev,
  ];
}

function formatIsoTimestamp(value: string): string {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return value;
  return new Date(ms).toLocaleString();
}

function generateTicketId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const n = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `TKT-${y}${m}${d}-${n}`;
}

export function ConversationDetailClient({
  conversation,
}: {
  conversation: ConversationDetail;
}) {
  const [reloadToken, setReloadToken] = useState(0);
  const [status, setStatus] = useState<ConversationStatus>(conversation.status);
  const [assignee, setAssignee] = useState(conversation.assignee);
  const [priority, setPriority] = useState<QueuePriority>(conversation.priority);
  const [notes, setNotes] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined);
  const [timeline, setTimeline] = useState<ConversationTimelineEntry[]>(() =>
    initialTimeline(conversation),
  );
  const [handoffTicket, setHandoffTicket] = useState<HandoffTicket | null>(null);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffReason, setHandoffReason] = useState<HandoffReason | "">("");
  const [handoffPriority, setHandoffPriority] = useState<QueuePriority | "">("");
  const [handoffNotes, setHandoffNotes] = useState("");
  const [handoffErrors, setHandoffErrors] = useState<HandoffFormErrors>({});
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    const localState = loadLocalState(conversation);
    // Hydrate local client state from localStorage for this conversation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(localState.status);
    setAssignee(localState.assignee);
    setPriority(localState.priority);
    setNotes(localState.notes);
    setUpdatedAt(localState.updatedAt);
    setTimeline(localState.timeline);
    setHandoffTicket(localState.handoffTicket);
    setHandoffOpen(false);
    setHandoffReason("");
    setHandoffPriority("");
    setHandoffNotes("");
    setHandoffErrors({});
    setToastOpen(false);
    setToastMessage("");
  }, [conversation, reloadToken]);

  useEffect(() => {
    const handleDemoReset = () => setReloadToken((current) => current + 1);
    window.addEventListener(demoDataResetEvent, handleDemoReset);
    return () => window.removeEventListener(demoDataResetEvent, handleDemoReset);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: ConversationLocalState = {
      status,
      assignee,
      priority,
      notes,
      timeline,
      handoffTicket,
      updatedAt,
    };
    writeCustomerServiceConversationState(conversation.id, payload);
  }, [assignee, conversation.id, handoffTicket, notes, priority, status, timeline, updatedAt]);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const actionSummary = useMemo(
    () => `${status} - Assigned to ${assignee}`,
    [assignee, status],
  );

  const assignToQueue = () => {
    setAssignee("Tier-2 Queue");
    setUpdatedAt(new Date().toISOString());
    setTimeline((prev) => addTimelineEntry(prev, "Conversation assigned to Tier-2 Queue."));
  };

  const resolveConversation = () => {
    setStatus("Resolved");
    setUpdatedAt(new Date().toISOString());
    setTimeline((prev) => addTimelineEntry(prev, "Conversation marked as resolved."));
  };

  const escalateConversation = () => {
    setStatus("Escalated");
    setUpdatedAt(new Date().toISOString());
    setTimeline((prev) => addTimelineEntry(prev, "Conversation escalated to engineering."));
  };

  const isHandoffFormValid = handoffReason !== "" && handoffPriority !== "";

  const validateHandoffForm = (): HandoffFormErrors => {
    const errors: HandoffFormErrors = {};
    if (!handoffReason) {
      errors.reason = "Reason is required.";
    }
    if (!handoffPriority) {
      errors.priority = "Priority is required.";
    }
    return errors;
  };

  const createHandoffTicket = () => {
    const errors = validateHandoffForm();
    setHandoffErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const ticketId = generateTicketId();
    const createdAt = new Date().toISOString();
    const ticket: HandoffTicket = {
      id: ticketId,
      reason: handoffReason as HandoffReason,
      priority: handoffPriority as QueuePriority,
      notes: handoffNotes.trim() || undefined,
      createdAt,
    };

    setHandoffTicket(ticket);
    setPriority(ticket.priority);
    setStatus("Escalated");
    setUpdatedAt(new Date().toISOString());
    setTimeline((prev) =>
      addTimelineEntry(
        prev,
        `Handoff created: ${ticketId} (Reason: ${ticket.reason}, Priority: ${ticket.priority})`,
      ),
    );
    setHandoffOpen(false);
    setHandoffReason("");
    setHandoffPriority("");
    setHandoffNotes("");
    setHandoffErrors({});
    setToastMessage(`Handoff created: ${ticketId}`);
    setToastOpen(true);
  };

  return (
    <div className="space-y-6">
      <Toast
        message={toastMessage}
        onClose={() => setToastOpen(false)}
        open={toastOpen}
      />
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Conversation</p>
          <h1 className="text-2xl font-semibold">{conversation.id}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {conversation.customer} - {conversation.topic}
          </p>
        </div>
        <Link
          href="/customer-service"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        >
          Back to conversations
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-lg border border-gray-200 bg-white p-4 xl:col-span-2">
          <h2 className="text-lg font-semibold">Transcript</h2>
          <div className="mt-4 space-y-3">
            {conversation.transcript.map((message, idx) => (
              <div
                key={`${message.time}-${idx}`}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.from === "Agent"
                    ? "ml-auto bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-xs opacity-80">
                  {message.from} - {message.time}
                </p>
                <p className="mt-1">{message.text}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Metadata</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Customer</dt>
              <dd className="text-gray-900">{conversation.customer}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Channel</dt>
              <dd className="text-gray-900">{conversation.channel}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Assignee</dt>
              <dd className="text-gray-900">{assignee}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Current State</dt>
              <dd className="text-gray-900">{actionSummary}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={badgeVariantForPriority(priority)}>
              {priority} priority
            </Badge>
            <Badge variant={badgeVariantForStatus(status)}>{status}</Badge>
            {conversation.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onClick={assignToQueue}
                type="button"
              >
                Assign
              </button>
              <button
                className="rounded-md border border-green-300 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2"
                onClick={resolveConversation}
                type="button"
              >
                Resolve
              </button>
              <button
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
                onClick={escalateConversation}
                type="button"
              >
                Escalate
              </button>
              <button
                className="rounded-md border border-indigo-300 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
                onClick={() => setHandoffOpen(true)}
                type="button"
              >
                Handoff to Human
              </button>
            </div>
          </div>

          {handoffTicket ? (
            <div className="mt-4 rounded-md border border-indigo-200 bg-indigo-50 p-3 text-sm">
              <h3 className="font-semibold text-indigo-900">Handoff Ticket</h3>
              <dl className="mt-2 space-y-1">
                <div className="flex gap-2">
                  <dt className="text-indigo-700">ID:</dt>
                  <dd className="text-indigo-900">{handoffTicket.id}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-indigo-700">Reason:</dt>
                  <dd className="text-indigo-900">{handoffTicket.reason}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-indigo-700">Priority:</dt>
                  <dd className="text-indigo-900">{handoffTicket.priority}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-indigo-700">Created:</dt>
                  <dd className="text-indigo-900">
                    {formatIsoTimestamp(handoffTicket.createdAt)}
                  </dd>
                </div>
                {handoffTicket.notes ? (
                  <div className="flex gap-2">
                    <dt className="text-indigo-700">Notes:</dt>
                    <dd className="text-indigo-900">{handoffTicket.notes}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-lg border border-gray-200 bg-white p-4 xl:col-span-2">
          <h2 className="text-lg font-semibold">Internal Notes</h2>
          <textarea
            className="mt-4 min-h-36 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add internal context, handoff details, or follow-up actions."
            value={notes}
          />
        </article>

        <aside className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <ul className="mt-4 space-y-3">
            {timeline.map((entry) => (
              <li key={entry.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{formatIsoTimestamp(entry.time)}</p>
                <p className="mt-1 text-sm text-gray-700">{entry.text}</p>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <Modal
        open={handoffOpen}
        title="Create Handoff Ticket"
        onClose={() => {
          setHandoffOpen(false);
          setHandoffErrors({});
        }}
        footer={
          <>
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => {
                setHandoffOpen(false);
                setHandoffErrors({});
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-md border border-indigo-300 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white"
              disabled={!isHandoffFormValid}
              onClick={createHandoffTicket}
              type="button"
            >
              Create Ticket
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-700" htmlFor="handoff-reason">
              Reason
            </label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              id="handoff-reason"
              onChange={(event) => {
                const value = event.target.value as HandoffReason | "";
                setHandoffReason(value);
                setHandoffErrors((prev) => ({ ...prev, reason: undefined }));
              }}
              value={handoffReason}
            >
              <option value="">Select reason</option>
              <option value="Billing">Billing</option>
              <option value="Technical">Technical</option>
              <option value="Complaint">Complaint</option>
              <option value="Other">Other</option>
            </select>
            {handoffErrors.reason ? (
              <p className="mt-1 text-xs text-red-600">{handoffErrors.reason}</p>
            ) : null}
          </div>
          <div>
            <label className="text-sm text-gray-700" htmlFor="handoff-priority">
              Priority
            </label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              id="handoff-priority"
              onChange={(event) => {
                const value = event.target.value as QueuePriority | "";
                setHandoffPriority(value);
                setHandoffErrors((prev) => ({ ...prev, priority: undefined }));
              }}
              value={handoffPriority}
            >
              <option value="">Select priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {handoffErrors.priority ? (
              <p className="mt-1 text-xs text-red-600">{handoffErrors.priority}</p>
            ) : null}
          </div>
          <div>
            <label className="text-sm text-gray-700" htmlFor="handoff-notes">
              Notes (optional)
            </label>
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              id="handoff-notes"
              onChange={(event) => setHandoffNotes(event.target.value)}
              value={handoffNotes}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
