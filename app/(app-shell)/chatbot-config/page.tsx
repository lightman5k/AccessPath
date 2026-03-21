"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Card, PageHeader } from "@/components/ui";
import type { ChatMessageTurn, ChatResponse, ScheduleResponse } from "@/types";

type ToneOption = "Professional" | "Friendly" | "Minimal";
type FaqStatus = "active" | "draft";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  status: FaqStatus;
};

type PreviewMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  response?: ChatResponse;
  schedule?: ScheduleResponse | null;
};

const initialAssistantName = "AccessPath Assistant";
const initialTone: ToneOption = "Professional";
const initialWelcomeMessage =
  "Hello! I'm the AccessPath Assistant. I've been configured with your latest Professional persona. How can I assist you today?";
const initialChannelLabel = "Web chat / English (US)";

const toneOptions: ToneOption[] = ["Professional", "Friendly", "Minimal"];

const escalationOptions = [
  "Billing or refund requests",
  "Negative sentiment or complaint language",
  "Account access or security issues",
  "Low confidence after two responses",
];

const initialFaqItems: FaqItem[] = [
  {
    id: "faq-order-status",
    question: "How can I check my order status?",
    answer:
      "Customers can use the tracking link in their confirmation email or ask for a live order lookup in chat.",
    status: "active",
  },
  {
    id: "faq-shipping-rates",
    question: "What shipping pricing should the bot quote for small businesses?",
    answer:
      "Use flat-rate local delivery language when parcel size qualifies, and offer logistics handoff for custom fulfillment requests.",
    status: "active",
  },
  {
    id: "faq-delays",
    question: "What should the assistant say about delays?",
    answer:
      "Acknowledge the delay, share the latest ETA when available, and recommend a human handoff for urgent orders.",
    status: "draft",
  },
];

const seededPreviewResponse: ChatResponse = {
  reply:
    "Based on your logistics module, we offer flat-rate shipping for local US deliveries at $5.99 per parcel.",
  intent: "general_faq",
  confidence: 0.89,
  handoffRecommended: false,
  suggestedNextAction:
    "Offer logistics team routing if the customer asks about bulk, international, or oversized shipments.",
};

const fieldClasses =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2";

function createSeedMessages(welcomeMessage: string): PreviewMessage[] {
  return [
    {
      id: "seed-assistant-1",
      role: "assistant",
      content: welcomeMessage,
    },
    {
      id: "seed-user-1",
      role: "user",
      content: "What are your shipping rates for small businesses?",
    },
    {
      id: "seed-assistant-2",
      role: "assistant",
      content: seededPreviewResponse.reply,
      response: seededPreviewResponse,
      schedule: null,
    },
  ];
}

function statusVariant(status: FaqStatus) {
  return status === "active" ? "success" : "warning";
}

function intentLabel(intent?: ChatResponse["intent"]) {
  if (!intent) return "Awaiting message";

  const labels: Record<ChatResponse["intent"], string> = {
    booking: "Booking",
    pricing: "Pricing",
    refund: "Refund",
    order_status: "Order status",
    business_hours: "Business hours",
    human_handoff: "Human handoff",
    general_faq: "General FAQ",
  };

  return labels[intent];
}

function SectionIcon({ kind }: { kind: "bot" | "shield" | "faq" | "preview" | "tip" | "spark" }) {
  if (kind === "bot") {
    return (
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
        <rect x="5" y="7" width="14" height="10" rx="4" />
        <path d="M12 4v3" />
        <path d="M9.5 11h.01" />
        <path d="M14.5 11h.01" />
        <path d="M9 14h6" />
      </svg>
    );
  }

  if (kind === "shield") {
    return (
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
        <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
        <path d="M10 12l1.5 1.5L14.5 10" />
      </svg>
    );
  }

  if (kind === "faq") {
    return (
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
        <path d="M5 5h14v14H5z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </svg>
    );
  }

  if (kind === "preview") {
    return (
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
        <path d="M4 5h16v12H4z" />
        <path d="M8 19h8" />
        <path d="M9 9h6" />
        <path d="M9 13h4" />
      </svg>
    );
  }

  if (kind === "tip") {
    return (
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
        <path d="M12 3v3" />
        <path d="M5.6 5.6l2.1 2.1" />
        <path d="M3 12h3" />
        <path d="M18 12h3" />
        <path d="M16.3 7.7l2.1-2.1" />
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M8 14a4 4 0 1 1 8 0c0 1.4-.7 2.2-1.6 3.1-.7.6-1.4 1.3-1.4 1.9h-2c0-.6-.7-1.3-1.4-1.9C8.7 16.2 8 15.4 8 14z" />
      </svg>
    );
  }

  return (
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
      <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
      <path d="M6 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
    </svg>
  );
}

function SectionHeader({
  description,
  icon,
  title,
}: {
  description: string;
  icon: "bot" | "shield" | "faq" | "preview" | "tip" | "spark";
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
        <SectionIcon kind={icon} />
      </span>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        checked ? "bg-sky-600" : "bg-slate-200"
      }`}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function ChatbotConfigPage() {
  const [assistantName, setAssistantName] = useState(initialAssistantName);
  const [tone, setTone] = useState<ToneOption>(initialTone);
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage);
  const [channelLabel, setChannelLabel] = useState(initialChannelLabel);
  const [humanHandoffEnabled, setHumanHandoffEnabled] = useState(true);
  const [aiDisclosureEnabled, setAiDisclosureEnabled] = useState(true);
  const [selectedEscalations, setSelectedEscalations] = useState<string[]>([
    escalationOptions[0],
    escalationOptions[2],
    escalationOptions[3],
  ]);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.78);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(initialFaqItems);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [previewInput, setPreviewInput] = useState("");
  const [messages, setMessages] = useState<PreviewMessage[]>(() =>
    createSeedMessages(initialWelcomeMessage),
  );
  const [latestResponse, setLatestResponse] = useState<ChatResponse | null>(seededPreviewResponse);
  const [latestSchedule, setLatestSchedule] = useState<ScheduleResponse | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const conversationRef = useRef<HTMLDivElement | null>(null);

  const activeFaqCount = useMemo(
    () => faqItems.filter((item) => item.status === "active").length,
    [faqItems],
  );

  const resetDraft = () => {
    setAssistantName(initialAssistantName);
    setTone(initialTone);
    setWelcomeMessage(initialWelcomeMessage);
    setChannelLabel(initialChannelLabel);
    setHumanHandoffEnabled(true);
    setAiDisclosureEnabled(true);
    setSelectedEscalations([
      escalationOptions[0],
      escalationOptions[2],
      escalationOptions[3],
    ]);
    setConfidenceThreshold(0.78);
    setFaqItems(initialFaqItems);
    setDraftQuestion("");
    setDraftAnswer("");
    setPreviewInput("");
    setMessages(createSeedMessages(initialWelcomeMessage));
    setLatestResponse(seededPreviewResponse);
    setLatestSchedule(null);
    setChatError(null);
    setScheduleError(null);
    setChatLoading(false);
    setScheduleLoading(false);
    setPublishedAt(null);
  };

  const toggleEscalation = (value: string) => {
    setSelectedEscalations((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const addFaqItem = () => {
    const question = draftQuestion.trim();
    const answer = draftAnswer.trim();

    if (!question || !answer) return;

    setFaqItems((current) => [
      ...current,
      { id: `faq-${Date.now()}`, question, answer, status: "draft" },
    ]);
    setDraftQuestion("");
    setDraftAnswer("");
  };

  const toggleFaqStatus = (id: string) => {
    setFaqItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "active" ? "draft" : "active" }
          : item,
      ),
    );
  };

  const removeFaqItem = (id: string) => {
    setFaqItems((current) => current.filter((item) => item.id !== id));
  };

  useEffect(() => {
    setMessages((current) => {
      if (current.length < 1 || current[0]?.id !== "seed-assistant-1") return current;

      const next = [...current];
      next[0] = {
        ...next[0],
        content: welcomeMessage,
      };
      return next;
    });
  }, [welcomeMessage]);

  useEffect(() => {
    const node = conversationRef.current;
    if (!node) return;
    node.scrollTo({
      top: node.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, chatLoading, chatError, scheduleError]);

  const sendPreviewMessage = async () => {
    const message = previewInput.trim();
    if (!message || chatLoading) return;

    const userMessage: PreviewMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    };

    const history: ChatMessageTurn[] = [...messages, userMessage].map((item) => ({
      role: item.role,
      content: item.content,
    }));

    setMessages((current) => [...current, userMessage]);
    setPreviewInput("");
    setChatLoading(true);
    setScheduleLoading(false);
    setChatError(null);
    setScheduleError(null);
    setLatestSchedule(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          channel: channelLabel,
          history,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat test failed with status ${response.status}.`);
      }

      const chatPayload = (await response.json()) as ChatResponse;
      let schedulePayload: ScheduleResponse | null = null;

      if (chatPayload.intent === "booking") {
        setScheduleLoading(true);

        try {
          const scheduleResponse = await fetch("/api/schedule", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }),
          });

          if (!scheduleResponse.ok) {
            throw new Error(`Schedule lookup failed with status ${scheduleResponse.status}.`);
          }

          schedulePayload = (await scheduleResponse.json()) as ScheduleResponse;
          setLatestSchedule(schedulePayload);
        } catch (scheduleFetchError) {
          setScheduleError(
            scheduleFetchError instanceof Error
              ? scheduleFetchError.message
              : "Unable to load scheduling suggestions right now.",
          );
        } finally {
          setScheduleLoading(false);
        }
      }

      setLatestResponse(chatPayload);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: chatPayload.reply,
          response: chatPayload,
          schedule: schedulePayload,
        },
      ]);
    } catch (fetchError) {
      setChatError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to test the assistant right now.",
      );
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="-m-4 overflow-hidden bg-[#f5f9ff] lg:-m-6">
      <div className="border-b border-slate-200 bg-white/90 px-6 py-5 backdrop-blur">
        <div className="mx-auto max-w-[1600px]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Customer Service / Chatbot Config
          </p>
          <div className="mt-2">
            <PageHeader
              title="AI Chatbot Configuration"
              description="Configure assistant identity, safety rules, and live response behavior before pushing changes into the demo environment."
              actions={
                <>
                  {publishedAt ? (
                    <Badge variant="success" className="px-3 py-1">
                      Published at {publishedAt}
                    </Badge>
                  ) : (
                    <Badge variant="neutral" className="px-3 py-1">
                      Draft mode
                    </Badge>
                  )}
                  <button
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                    onClick={resetDraft}
                    type="button"
                  >
                    Reset Draft
                  </button>
                  <button
                    className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                    onClick={() =>
                      setPublishedAt(
                        new Date().toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        }),
                      )
                    }
                    type="button"
                  >
                    Publish Changes
                  </button>
                </>
              }
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] xl:grid xl:grid-cols-[minmax(0,1.04fr)_470px]">
        <div className="border-b border-slate-200 px-6 py-6 xl:border-b-0 xl:border-r">
          <div className="space-y-6">
            <Card className="rounded-[24px] border-sky-200 bg-gradient-to-r from-sky-50 via-white to-white p-5 shadow-[0_12px_32px_rgba(14,165,233,0.08)]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <SectionIcon kind="tip" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-sky-900">Configuration Tip</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Personalizing your bot greeting can increase conversion rates and reduce repeat support
                    questions. Use the live preview to validate tone, routing, and booking behavior before
                    publishing.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[24px] border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <SectionHeader
                description="Define how your assistant appears to customers across the current MVP channels."
                icon="bot"
                title="Assistant Profile"
              />

              <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="assistant-name">
                    Bot name
                  </label>
                  <input
                    id="assistant-name"
                    className={fieldClasses}
                    onChange={(event) => setAssistantName(event.target.value)}
                    type="text"
                    value={assistantName}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700">Tone / personality</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {toneOptions.map((option) => {
                      const active = tone === option;
                      return (
                        <button
                          className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                            active
                              ? "border-sky-300 bg-sky-50 text-sky-700 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                          key={option}
                          onClick={() => setTone(option)}
                          type="button"
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="xl:col-span-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="welcome-message">
                    Welcome message
                  </label>
                  <textarea
                    id="welcome-message"
                    className={`${fieldClasses} min-h-28`}
                    onChange={(event) => setWelcomeMessage(event.target.value)}
                    value={welcomeMessage}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="channel-label">
                    Channel / language
                  </label>
                  <input
                    id="channel-label"
                    className={fieldClasses}
                    onChange={(event) => setChannelLabel(event.target.value)}
                    type="text"
                    value={channelLabel}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Live persona
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    <span className="font-semibold text-slate-950">{assistantName}</span> is currently tuned for a{" "}
                    <span className="font-semibold text-slate-950">{tone}</span> voice in{" "}
                    <span className="font-semibold text-slate-950">{channelLabel}</span>.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[24px] border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <SectionHeader
                description="Configure disclosure, human fallback behavior, and confidence-based escalation rules."
                icon="shield"
                title="Handoff & Safety"
              />

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Human handoff</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Route complex or sensitive conversations to a live support queue.
                      </p>
                    </div>
                    <Toggle checked={humanHandoffEnabled} onChange={setHumanHandoffEnabled} />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">AI disclosure</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Tell customers they are speaking to an AI assistant before the first reply.
                      </p>
                    </div>
                    <Toggle checked={aiDisclosureEnabled} onChange={setAiDisclosureEnabled} />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
                <div>
                  <p className="text-sm font-medium text-slate-700">Escalation conditions</p>
                  <div className="mt-3 space-y-3">
                    {escalationOptions.map((option) => {
                      const checked = selectedEscalations.includes(option);
                      return (
                        <label
                          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                            checked
                              ? "border-sky-200 bg-sky-50/70"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                          key={option}
                        >
                          <input
                            checked={checked}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-300"
                            onChange={() => toggleEscalation(option)}
                            type="checkbox"
                          />
                          <span className="text-sm leading-6 text-slate-700">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Confidence threshold
                  </p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                    {(confidenceThreshold * 100).toFixed(0)}%
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Below this score, the assistant recommends human review.
                  </p>
                  <input
                    aria-label="Confidence threshold"
                    className="mt-5 w-full accent-sky-600"
                    max="0.95"
                    min="0.4"
                    onChange={(event) => setConfidenceThreshold(Number(event.target.value))}
                    step="0.01"
                    type="range"
                    value={confidenceThreshold}
                  />
                  <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>More autonomous</span>
                    <span>More cautious</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-[24px] border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <SectionHeader
                  description="Control which answers are active, keep drafts separate, and add new FAQ content for the assistant."
                  icon="faq"
                  title="Knowledge / FAQ"
                />
                <Badge variant="info" className="px-3 py-1">
                  {activeFaqCount} active / {faqItems.length - activeFaqCount} draft
                </Badge>
              </div>

              <div className="mt-6 space-y-3">
                {faqItems.map((item) => (
                  <div
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{item.question}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
                      </div>
                      <Badge variant={statusVariant(item.status)}>
                        {item.status === "active" ? "Active" : "Draft"}
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                        onClick={() => toggleFaqStatus(item.id)}
                        type="button"
                      >
                        {item.status === "active" ? "Move to Draft" : "Activate"}
                      </button>
                      <button
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
                        onClick={() => removeFaqItem(item.id)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Add FAQ draft</p>
                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_auto]">
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="faq-question">
                      Question
                    </label>
                    <input
                      id="faq-question"
                      className={fieldClasses}
                      onChange={(event) => setDraftQuestion(event.target.value)}
                      placeholder="Can the assistant schedule a callback?"
                      type="text"
                      value={draftQuestion}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="faq-answer">
                      Draft answer
                    </label>
                    <input
                      id="faq-answer"
                      className={fieldClasses}
                      onChange={(event) => setDraftAnswer(event.target.value)}
                      placeholder="Yes. It can suggest time slots and route qualified booking requests."
                      type="text"
                      value={draftAnswer}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                      onClick={addFaqItem}
                      type="button"
                    >
                      Add Draft
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="bg-[#edf5ff] px-6 py-6">
          <div className="sticky top-20 space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Live Tester
              </p>
              <Badge variant="neutral" className="px-3 py-1">
                Real-time Preview
              </Badge>
            </div>

            <Card className="overflow-hidden rounded-[28px] border-slate-200 bg-white p-0 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-200 bg-white px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                      <SectionIcon kind="preview" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-950">{assistantName}</p>
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      </div>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        AI Assistant Preview
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" className="px-3 py-1">
                    System Online
                  </Badge>
                </div>
              </div>

              <div className="bg-gradient-to-b from-[#f4f8ff] via-[#f8fbff] to-[#eef5ff] px-4 py-4">
                <div
                  className="h-[520px] space-y-4 overflow-y-auto rounded-[24px] border border-sky-100 bg-[#edf4fd] px-4 py-4 shadow-inner"
                  ref={conversationRef}
                >
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 text-center">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">No preview messages yet</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Send a test message to see intent detection, assistant replies, and scheduling behavior.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const user = message.role === "user";

                      return (
                        <div
                          className={`flex ${user ? "justify-end" : "justify-start"}`}
                          key={message.id}
                        >
                          <div className={`max-w-[82%] ${user ? "items-end" : "items-start"}`}>
                            <div
                              className={`rounded-[20px] px-4 py-3 shadow-sm ${
                                user
                                  ? "bg-sky-600 text-white"
                                  : "border border-slate-200 bg-white text-slate-700"
                              }`}
                            >
                              <p className="text-sm leading-6">{message.content}</p>
                            </div>

                            {!user && message.schedule?.availableSlots?.length ? (
                              <div className="mt-3 space-y-2">
                                {message.schedule.availableSlots.map((slot) => (
                                  <div
                                    className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3"
                                    key={slot.id}
                                  >
                                    <p className="text-sm font-semibold text-slate-900">{slot.label}</p>
                                    <p className="mt-1 text-xs text-slate-500">{slot.timezone}</p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {chatLoading ? (
                    <div className="flex justify-start">
                      <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300" />
                          <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300 [animation-delay:120ms]" />
                          <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300 [animation-delay:240ms]" />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {chatError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-sm font-medium text-red-900">Preview request failed</p>
                      <p className="mt-1 text-sm leading-6 text-red-800">{chatError}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-inner">
                  <input
                    className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    onChange={(event) => setPreviewInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void sendPreviewMessage();
                      }
                    }}
                    placeholder="Type a test message..."
                    type="text"
                    value={previewInput}
                  />
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!previewInput.trim() || chatLoading}
                    onClick={() => void sendPreviewMessage()}
                    type="button"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 2L11 13" />
                      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
                <p className="mt-3 text-center text-xs text-slate-500">
                  Changes only go live after clicking &quot;Publish Changes&quot;.
                </p>
              </div>
            </Card>

            <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <SectionHeader
                  description="Inspect how the current preview reply was classified and whether it should escalate."
                  icon="spark"
                  title="Response Intelligence"
                />
                <Badge
                  variant={
                    chatLoading || scheduleLoading
                      ? "neutral"
                      : latestResponse?.handoffRecommended
                        ? "warning"
                        : "success"
                  }
                  className="px-3 py-1"
                >
                  {chatLoading || scheduleLoading
                    ? "Processing"
                    : latestResponse?.handoffRecommended
                      ? "Handoff suggested"
                      : "AI can respond"}
                </Badge>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Detected intent
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {intentLabel(latestResponse?.intent)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Confidence
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {latestResponse ? `${(latestResponse.confidence * 100).toFixed(0)}%` : "--"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Handoff recommendation
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {latestResponse
                      ? latestResponse.handoffRecommended
                        ? humanHandoffEnabled
                          ? "Escalate to live queue"
                          : "Recommended, but disabled"
                        : "Handled by assistant"
                      : "Awaiting response"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Channel
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-950">{channelLabel}</p>
                </div>
              </div>

              {latestResponse?.suggestedNextAction || latestResponse?.reason ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Suggested next action
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {latestSchedule?.suggestedNextAction ??
                      latestResponse?.suggestedNextAction ??
                      latestResponse?.reason}
                  </p>
                </div>
              ) : null}

              {scheduleLoading ? (
                <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                  <p className="text-sm font-medium text-sky-900">Checking available booking slots...</p>
                </div>
              ) : null}

              {scheduleError ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-medium text-amber-900">Booking lookup failed</p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">{scheduleError}</p>
                </div>
              ) : null}

              {latestResponse?.intent === "booking" ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Available booking slots
                  </p>
                  {latestSchedule?.availableSlots?.length ? (
                    <div className="mt-3 grid gap-3">
                      {latestSchedule.availableSlots.map((slot) => (
                        <div
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
                          key={slot.id}
                        >
                          <p className="text-sm font-semibold text-slate-950">{slot.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{slot.timezone}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      No slot suggestions are available for the current request.
                    </p>
                  )}
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
