import { NextRequest, NextResponse } from "next/server";
import {
  buildApiErrorResponse,
  buildApiNoStoreHeaders,
  requireApiSession,
} from "@/lib/auth/api-guard";
import {
  customerServiceConversationById,
  customerServiceConversations,
} from "@/lib/mock";
import type { ChatIntent, ChatRequest, ChatResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IntentRule = {
  intent: ChatIntent;
  matchedFaq: string;
  confidence: number;
  handoffRecommended?: boolean;
  suggestedNextAction?: string;
  reason?: string;
  keywords: string[];
  reply: (message: string, conversationId?: string) => string;
};

const intentRules: IntentRule[] = [
  {
    intent: "booking",
    matchedFaq: "Appointment / booking assistance",
    confidence: 0.89,
    keywords: ["book", "booking", "schedule", "appointment", "reserve", "reservation"],
    suggestedNextAction: "Offer available booking windows or collect scheduling details.",
    reply: () =>
      "I can help with booking-related questions by confirming availability, capturing the preferred date or time, and guiding the customer to the next scheduling step.",
  },
  {
    intent: "pricing",
    matchedFaq: "Pricing and plan information",
    confidence: 0.87,
    keywords: ["price", "pricing", "cost", "quote", "plan", "plans", "subscription"],
    suggestedNextAction: "Share the relevant plan tier or offer a pricing follow-up.",
    reply: () =>
      "I can explain pricing, summarize the right plan based on the request, and suggest a follow-up if the customer needs a quote or sales review.",
  },
  {
    intent: "order_status",
    matchedFaq: "Delivery status request",
    confidence: 0.92,
    keywords: ["delivery", "shipment", "track", "tracking", "eta", "where is my order", "status"],
    suggestedNextAction: "Provide the latest order status and set a follow-up if delivery timing changes.",
    reply: (_, conversationId) => {
      const topic = conversationId
        ? customerServiceConversationById[conversationId]?.topic
        : undefined;
      return topic?.toLowerCase().includes("delivery")
        ? "I can help with the latest shipment status and delivery timing. For this request, I would confirm the most recent handoff point, provide the ETA, and set a follow-up alert if the shipment slips."
        : "I can help check shipment status, estimate arrival timing, and summarize the latest delivery update for the customer.";
    },
  },
  {
    intent: "refund",
    matchedFaq: "Return authorization",
    confidence: 0.84,
    keywords: ["refund", "return", "refunds", "money back", "cancel order", "cancel my order"],
    handoffRecommended: true,
    suggestedNextAction: "Route to refund or returns review if account-specific action is required.",
    reason: "Refund requests often require policy or order-specific review.",
    reply: () =>
      "I can explain the refund or return process, outline the likely next steps, and recommend human review when order-specific adjustments are needed.",
  },
  {
    intent: "business_hours",
    matchedFaq: "Business hours and availability",
    confidence: 0.95,
    keywords: ["hours", "open", "close", "closing", "available today", "business hours", "weekend hours"],
    suggestedNextAction: "Return support availability or direct the customer to the right operating window.",
    reply: () =>
      "I can share business hours, support availability, and the best time window for follow-up if the request needs a human response.",
  },
  {
    intent: "human_handoff",
    matchedFaq: "Human support handoff",
    confidence: 0.97,
    keywords: ["agent", "human", "representative", "real person", "someone call me", "handoff", "escalate"],
    handoffRecommended: true,
    suggestedNextAction: "Escalate to the support queue and preserve the conversation summary.",
    reason: "The customer is explicitly asking for a human agent.",
    reply: () =>
      "I can acknowledge the request, summarize the conversation for context, and route the customer to a human support agent.",
  },
  {
    intent: "general_faq",
    matchedFaq: "General support FAQ",
    confidence: 0.76,
    keywords: ["help", "how do i", "faq", "question", "policy", "support", "information"],
    suggestedNextAction: "Answer from FAQ content or ask one clarifying question.",
    reply: (_, conversationId) => {
      const knownTopic = conversationId
        ? customerServiceConversationById[conversationId]?.topic
        : undefined;
      return knownTopic
        ? `This looks related to "${knownTopic}". I can provide a concise FAQ-style answer and guide the customer toward the right next step.`
        : "I can handle common FAQ-style questions and provide a concise answer, then ask a clarifying question if the request is still broad.";
    },
  },
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildFallbackResponse(message: string): ChatResponse {
  const query = normalize(message);
  const matchedConversation = customerServiceConversations.find((item) => {
    const haystack = `${item.topic} ${item.preview}`.toLowerCase();
    return query && haystack.includes(query);
  });

  return {
    reply: matchedConversation
      ? `I found a related support pattern around "${matchedConversation.topic}". I can give a general response and recommend a human review if the customer needs account-specific action.`
      : "I can help with booking, pricing, refunds, order status, business hours, and general FAQ questions. If the request is sensitive or unclear, I would recommend escalation to a human agent.",
    intent: "general_faq",
    confidence: matchedConversation ? 0.74 : 0.58,
    handoffRecommended: !matchedConversation,
    suggestedNextAction: matchedConversation
      ? "Answer with the closest FAQ pattern and confirm whether the customer needs account-specific help."
      : "Ask one clarifying question or route to a human if the request remains ambiguous.",
    reason: matchedConversation
      ? undefined
      : "No strong rule match was found, so a human follow-up is safer for the demo.",
    matchedFaq: matchedConversation?.topic,
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if (!auth.ok) return auth.response;

  let body: ChatRequest;

  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return buildApiErrorResponse(
      {
        error: "Invalid JSON body.",
        code: "invalid_request",
      },
      400,
    );
  }

  const message = body.message?.trim();
  if (!message) {
    return buildApiErrorResponse(
      {
        error: "A non-empty message is required.",
        code: "invalid_request",
      },
      400,
    );
  }

  const normalizedMessage = normalize(message);
  const matchedRule = intentRules.find((rule) =>
    rule.keywords.some((keyword) => normalizedMessage.includes(keyword)),
  );

  const response: ChatResponse = matchedRule
    ? {
        reply: matchedRule.reply(message, body.conversationId),
        intent: matchedRule.intent,
        confidence: matchedRule.confidence,
        handoffRecommended: matchedRule.handoffRecommended ?? false,
        suggestedNextAction: matchedRule.suggestedNextAction,
        reason: matchedRule.reason,
        matchedFaq: matchedRule.matchedFaq,
        conversationId: body.conversationId,
      }
    : {
        ...buildFallbackResponse(message),
        conversationId: body.conversationId,
      };

  return NextResponse.json(response, {
    headers: buildApiNoStoreHeaders(),
  });
}
