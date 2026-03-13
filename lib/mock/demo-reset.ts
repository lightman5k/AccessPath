"use client";

import {
  clearCustomerServiceConversationStates,
  clearStoredIntegrations,
  clearStoredMockSession,
  clearStoredSettings,
  clearStoredWorkflow,
  defaultStoredWorkflow,
  writeCustomerServiceConversationState,
  writeStoredIntegrations,
  writeStoredMockSession,
  writeStoredWorkflow,
} from "@/lib";
import { defaultMockSession } from "@/lib/mock/session";
import { mockWorkflowTemplate } from "@/lib/mock/workflow";

export const demoDataResetEvent = "demo-data:reset";

export function resetDemoData() {
  if (typeof window === "undefined") return;

  clearStoredWorkflow();
  clearStoredIntegrations();
  clearStoredSettings();
  clearStoredMockSession();
  clearCustomerServiceConversationStates();

  writeStoredIntegrations([
      {
        id: "shopify",
        name: "Shopify",
        description: "Sync products, orders, and fulfillment events.",
        status: "connected",
        lastSyncAt: new Date().toISOString(),
      },
      {
        id: "salesforce",
        name: "Salesforce",
        description: "Push customer records and support account history.",
        status: "not-connected",
      },
      {
        id: "quickbooks",
        name: "QuickBooks",
        description: "Send invoice and payment updates to accounting.",
        status: "not-connected",
      },
      {
        id: "google-drive",
        name: "Google Drive",
        description: "Archive reports and workflow exports to shared folders.",
        status: "not-connected",
      },
    ]);

  writeStoredWorkflow({
    ...defaultStoredWorkflow(),
    ...mockWorkflowTemplate,
    nodes: mockWorkflowTemplate.nodes,
  });

  writeCustomerServiceConversationState("cs-1042", {
      status: "Escalated",
      assignee: "Tier-2 Queue",
      priority: "High",
      notes: "Escalated for demo reset seed.",
      timeline: [
        {
          id: "seed-handoff",
          time: new Date().toISOString(),
          text: "Handoff created: TKT-DEMO-1042",
        },
      ],
      handoffTicket: {
        id: "TKT-DEMO-1042",
        reason: "Technical",
        priority: "High",
        notes: "Seeded handoff for demo walkthrough.",
        createdAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });

  writeStoredMockSession(defaultMockSession);
  window.dispatchEvent(new Event(demoDataResetEvent));
  window.dispatchEvent(new CustomEvent("mock-session:change", { detail: defaultMockSession }));
}
