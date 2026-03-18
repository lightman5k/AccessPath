"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, PageHeader } from "@/components/ui";
import type { ChatResponse } from "@/types";

type ToneOption = "Helpful & professional" | "Concise & direct" | "Warm & consultative";
type FaqStatus = "active" | "draft";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  status: FaqStatus;
};

const toneOptions: ToneOption[] = [
  "Helpful & professional",
  "Concise & direct",
  "Warm & consultative",
];

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
    answer: "Customers can use the tracking link in their confirmation email or request a status update in chat.",
    status: "active",
  },
  {
    id: "faq-return-policy",
    question: "What is the return policy?",
    answer: "Standard returns are accepted within 30 days for unused items, subject to category-specific exceptions.",
    status: "active",
  },
  {
    id: "faq-shipping-delay",
    question: "What should the assistant say about shipping delays?",
    answer: "Acknowledge the delay, provide the latest ETA if available, and offer a human handoff for urgent orders.",
    status: "draft",
  },
];

const summaryCardClasses = [
  "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
  "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
  "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
  "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
];

function statusVariant(status: FaqStatus) {
  return status === "active" ? "success" : "warning";
}

export default function ChatbotConfigPage() {
  const [assistantName, setAssistantName] = useState("AccessPath Assistant");
  const [tone, setTone] = useState<ToneOption>("Helpful & professional");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hi, I'm AccessPath Assistant. I can help with order status, policies, account questions, and route urgent issues to a human agent.",
  );
  const [channelLabel, setChannelLabel] = useState("Web chat - English");
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
  const [testQuestion, setTestQuestion] = useState("Where is my order? It says delayed.");
  const [testPreview, setTestPreview] = useState<ChatResponse | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const activeFaqCount = useMemo(
    () => faqItems.filter((item) => item.status === "active").length,
    [faqItems],
  );

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
    const message = testQuestion.trim();
    if (!message) {
      setTestPreview(null);
      setTestError(null);
      setTestLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setTestLoading(true);
      setTestError(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            channel: channelLabel,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Chat test failed with status ${response.status}.`);
        }

        const payload = (await response.json()) as ChatResponse;
        setTestPreview(payload);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setTestError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to test the assistant right now.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setTestLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [channelLabel, testQuestion]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AccessPath Chatbot Config"
        description="Configure assistant behavior, safety rules, FAQ coverage, and live response previews for the MVP demo."
        actions={
          <>
            <Badge variant="info" className="px-3 py-1">Demo mode</Badge>
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              type="button"
            >
              Publish changes
            </button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {[
          {
            label: "Assistant status",
            value: "Live in demo",
            helperText: `${assistantName} is configured for ${channelLabel}.`,
          },
          {
            label: "FAQ coverage",
            value: `${activeFaqCount} active`,
            helperText: `${faqItems.length - activeFaqCount} draft items pending review.`,
          },
          {
            label: "Handoff mode",
            value: humanHandoffEnabled ? "Enabled" : "Disabled",
            helperText: `Escalates below ${(confidenceThreshold * 100).toFixed(0)}% confidence.`,
          },
          {
            label: "Disclosure",
            value: aiDisclosureEnabled ? "Visible" : "Hidden",
            helperText: "Controls whether customers are told they are speaking with AI.",
          },
        ].map((card, index) => (
          <Card key={card.label} className={`relative overflow-hidden border ${summaryCardClasses[index]} p-0 shadow-sm`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-400" />
            <div className="p-5">
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">{card.helperText}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <div className="space-y-6">
          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Assistant Profile</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Set the assistant identity, default tone, and customer-facing introduction.
                </p>
              </div>
              <Badge variant="neutral">Customer-facing</Badge>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="assistant-name">
                  Assistant name
                </label>
                <input
                  id="assistant-name"
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onChange={(event) => setAssistantName(event.target.value)}
                  type="text"
                  value={assistantName}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="assistant-tone">
                  Tone / personality
                </label>
                <select
                  id="assistant-tone"
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onChange={(event) => setTone(event.target.value as ToneOption)}
                  value={tone}
                >
                  {toneOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xl:col-span-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="welcome-message">
                  Welcome message
                </label>
                <textarea
                  id="welcome-message"
                  className="mt-2 min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onChange={(event) => setWelcomeMessage(event.target.value)}
                  value={welcomeMessage}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="channel-label">
                  Supported channel / language
                </label>
                <input
                  id="channel-label"
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onChange={(event) => setChannelLabel(event.target.value)}
                  type="text"
                  value={channelLabel}
                />
              </div>

              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700">Current voice</p>
                <p className="mt-2 text-sm text-gray-600">
                  {assistantName} is configured as <span className="font-medium text-gray-900">{tone}</span> for{" "}
                  <span className="font-medium text-gray-900">{channelLabel}</span>.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Handoff &amp; Safety Rules</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Control how the assistant discloses AI usage, escalates complex requests, and routes sensitive issues.
                </p>
              </div>
              <Badge variant={humanHandoffEnabled ? "success" : "warning"}>
                {humanHandoffEnabled ? "Human handoff enabled" : "AI-only mode"}
              </Badge>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <label className="flex items-start justify-between gap-4 rounded-md border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Enable human handoff</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Allow the assistant to route customers to a live agent when needed.
                  </p>
                </div>
                <input
                  checked={humanHandoffEnabled}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                  onChange={(event) => setHumanHandoffEnabled(event.target.checked)}
                  type="checkbox"
                />
              </label>

              <label className="flex items-start justify-between gap-4 rounded-md border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Show AI disclosure</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Inform customers that they are interacting with an AI assistant.
                  </p>
                </div>
                <input
                  checked={aiDisclosureEnabled}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                  onChange={(event) => setAiDisclosureEnabled(event.target.checked)}
                  type="checkbox"
                />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Escalation conditions</h3>
                <div className="mt-3 space-y-3">
                  {escalationOptions.map((option) => {
                    const checked = selectedEscalations.includes(option);
                    return (
                      <label
                        key={option}
                        className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3"
                      >
                        <input
                          checked={checked}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                          onChange={() => toggleEscalation(option)}
                          type="checkbox"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-900">Confidence threshold</p>
                <p className="mt-1 text-sm text-gray-600">
                  Below this score, the assistant recommends a handoff.
                </p>
                <p className="mt-4 text-3xl font-semibold text-gray-900">
                  {(confidenceThreshold * 100).toFixed(0)}%
                </p>
                <input
                  aria-label="Confidence threshold"
                  className="mt-4 w-full accent-gray-900"
                  max="0.95"
                  min="0.4"
                  onChange={(event) => setConfidenceThreshold(Number(event.target.value))}
                  step="0.01"
                  type="range"
                  value={confidenceThreshold}
                />
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>More autonomous</span>
                  <span>More cautious</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Knowledge / FAQ Management</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Curate common answers, mark draft content, and keep customer-facing guidance current.
                </p>
              </div>
              <Badge variant="info">{faqItems.length} total items</Badge>
            </div>

            <div className="mt-6 rounded-lg border border-gray-200">
              <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_110px_180px] gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                <span>Question</span>
                <span>Answer</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              <div className="divide-y divide-gray-200">
                {faqItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_110px_180px] gap-4 px-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.question}</p>
                    </div>
                    <p className="text-sm text-gray-600">{item.answer}</p>
                    <div>
                      <Badge variant={statusVariant(item.status)}>
                        {item.status === "active" ? "Active" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                        onClick={() => toggleFaqStatus(item.id)}
                        type="button"
                      >
                        {item.status === "active" ? "Move to draft" : "Activate"}
                      </button>
                      <button
                        className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
                        onClick={() => removeFaqItem(item.id)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="new-faq-question">
                  New FAQ question
                </label>
                <input
                  id="new-faq-question"
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onChange={(event) => setDraftQuestion(event.target.value)}
                  placeholder="Example: Can the assistant help with returns?"
                  type="text"
                  value={draftQuestion}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="new-faq-answer">
                  Draft answer
                </label>
                <input
                  id="new-faq-answer"
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onChange={(event) => setDraftAnswer(event.target.value)}
                  placeholder="Provide a concise answer for the assistant knowledge base."
                  type="text"
                  value={draftAnswer}
                />
              </div>

              <div className="flex items-end">
                <button
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onClick={addFaqItem}
                  type="button"
                >
                  Add draft FAQ
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Test Panel</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Preview intent detection, response quality, and whether current rules trigger a handoff.
                </p>
              </div>
              <Badge
                variant={
                  testLoading
                    ? "neutral"
                    : testPreview?.handoffRecommended
                      ? "warning"
                      : "success"
                }
              >
                {testLoading
                  ? "Testing..."
                  : testPreview?.handoffRecommended
                    ? "Handoff recommended"
                    : "AI can respond"}
              </Badge>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700" htmlFor="test-question">
                Sample customer question
              </label>
              <textarea
                id="test-question"
                className="mt-2 min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                onChange={(event) => setTestQuestion(event.target.value)}
                value={testQuestion}
              />
            </div>

            <div className="mt-6 space-y-4">
              {testError ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">Test request failed</p>
                  <p className="mt-1 text-sm text-amber-800">{testError}</p>
                </div>
              ) : null}

              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Detected intent</p>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {testPreview?.intent ?? "Awaiting input"}
                </p>
              </div>

              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Suggested response preview
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {testPreview?.reply ??
                    "Enter a sample customer question to preview the API-detected intent and suggested response."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Confidence</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">
                    {testPreview ? `${(testPreview.confidence * 100).toFixed(0)}%` : "--"}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Handoff preview</p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {testPreview
                      ? testPreview.handoffRecommended
                        ? humanHandoffEnabled
                          ? "Escalate to human queue"
                          : "Recommended, but handoff is disabled"
                        : "Handled by assistant"
                      : "Awaiting result"}
                  </p>
                </div>
              </div>

              {testPreview?.suggestedNextAction || testPreview?.reason ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Suggested next action
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {testPreview?.suggestedNextAction ?? testPreview?.reason}
                  </p>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Deployment Notes</h2>
            <p className="mt-1 text-sm text-gray-600">
              Practical MVP guardrails for demo readiness and future backend wiring.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
                Publish should eventually persist profile, safety, and FAQ settings to the assistant service.
              </li>
              <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
                Test panel intent scoring is local-only for now and should later map to real model evaluation.
              </li>
              <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
                Draft FAQ items are intentionally separated so non-approved content does not appear live.
              </li>
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}
