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
    <div className="space-y-8">
      <Toast
        message={toastMessage}
        onClose={() => setToastOpen(false)}
        open={toastOpen}
      />
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/customer-service"
              className="rounded-md border border-gray-300 p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <p className="text-sm text-gray-500">Support Ticket</p>
              <h1 className="text-2xl font-semibold text-gray-900">{conversation.id}</h1>
              <p className="mt-1 text-sm text-gray-600">
                {conversation.customer} • {conversation.topic}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <Badge variant={badgeVariantForPriority(priority)}>
              {priority} Priority
            </Badge>
            <Badge variant={badgeVariantForStatus(status)}>{status}</Badge>
          </div>
          <Link
            href="/customer-service"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            Back to Support Hub
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <article className="rounded-lg border border-gray-200 bg-white p-6 xl:col-span-2">
          <header className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Conversation Transcript</h2>
            <p className="mt-1 text-sm text-gray-600">Complete message history for this support ticket</p>
          </header>
          <div className="space-y-4">
            {conversation.transcript.map((message, idx) => (
              <div
                key={`${message.time}-${idx}`}
                className={`flex ${
                  message.from === "Agent" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-3 ${
                    message.from === "Agent"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900 border border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${
                      message.from === "Agent" ? "text-blue-100" : "text-gray-500"
                    }`}>
                      {message.from}
                    </span>
                    <span className={`text-xs ${
                      message.from === "Agent" ? "text-blue-200" : "text-gray-400"
                    }`}>
                      {message.time}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Ticket Details</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Customer</dt>
                <dd className="text-gray-900 font-medium">{conversation.customer}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Channel</dt>
                <dd className="text-gray-900 font-medium">{conversation.channel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Assignee</dt>
                <dd className="text-gray-900 font-medium">{assignee}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className="text-gray-900 font-medium">{actionSummary}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {conversation.tags.map((tag) => (
                  <Badge key={tag} variant="neutral">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 text-center hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 transition-colors"
                onClick={assignToQueue}
                type="button"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-medium text-gray-900">Assign</span>
              </button>
              <button
                className="flex flex-col items-center gap-2 rounded-lg border border-green-200 p-4 text-center hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 transition-colors"
                onClick={resolveConversation}
                type="button"
              >
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-gray-900">Resolve</span>
              </button>
              <button
                className="flex flex-col items-center gap-2 rounded-lg border border-red-200 p-4 text-center hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 transition-colors"
                onClick={escalateConversation}
                type="button"
              >
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-xs font-medium text-gray-900">Escalate</span>
              </button>
              <button
                className="flex flex-col items-center gap-2 rounded-lg border border-indigo-200 p-4 text-center hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors"
                onClick={() => setHandoffOpen(true)}
                type="button"
              >
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-xs font-medium text-gray-900">Handoff</span>
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

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <article className="rounded-lg border border-gray-200 bg-white p-6 xl:col-span-2">
          <header className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Internal Notes</h2>
            <p className="mt-1 text-sm text-gray-600">Add context, resolution details, or follow-up actions</p>
          </header>
          <textarea
            className="min-h-40 w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 resize-none"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Document resolution steps, customer preferences, or escalation details..."
            value={notes}
          />
        </article>

        <aside className="rounded-lg border border-gray-200 bg-white p-6">
          <header className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
            <p className="mt-1 text-sm text-gray-600">Recent updates and changes</p>
          </header>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {timeline.map((entry) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div className="h-full w-px bg-gray-200 mt-1"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-xs text-gray-500">{formatIsoTimestamp(entry.time)}</p>
                  <p className="mt-1 text-sm text-gray-700 leading-relaxed">{entry.text}</p>
                </div>
              </div>
            ))}
          </div>
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
