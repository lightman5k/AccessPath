"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, Modal, Toast } from "@/components/ui";
import { clearStoredWorkflow, readStoredWorkflow, writeStoredWorkflow } from "@/lib";
import {
  demoDataResetEvent,
  featureRequirements,
  hasFeatureAccess,
  mockWorkflowTemplate,
  mockWorkflowTemplates,
  saveMockSession,
  useMockSession,
} from "@/lib/mock";
import type { Workflow, WorkflowNode, WorkflowNodeType } from "@/types";

type LibraryGroup = "Triggers" | "AI Agents" | "Standard Actions";

type LibraryEntry = {
  id: string;
  group: LibraryGroup;
  label: string;
  description: string;
  type: WorkflowNodeType;
  value: string;
  notes: string;
};

const NODE_WIDTH = 276;
const NODE_HEIGHT = 118;
const ZOOM_LEVELS = [0.8, 1, 1.2] as const;
const WORKFLOW_VERSION = "v2.1";
const fieldClasses =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2";

const referenceWorkflow: Workflow = {
  id: "wf-smart-order-fulfillment-v2",
  name: "Smart Order Fulfillment",
  description: "Validate inventory, route orders, and automate fulfillment follow-ups.",
  nodes: [
    {
      id: "node-1",
      type: "Trigger",
      name: "New Shopify Order",
      position: { x: 84, y: 172 },
      config: {
        eventKey: "Store API v2",
        notes: "Triggers when a new customer order is placed.",
      },
    },
    {
      id: "node-2",
      type: "Action",
      name: "AI Stock Check",
      position: { x: 460, y: 172 },
      config: {
        operation: "inventory.check",
        notes: "Validates inventory availability and estimates lead time.",
      },
    },
    {
      id: "node-3",
      type: "Condition",
      name: "Inventory Available?",
      position: { x: 836, y: 172 },
      config: {
        rule: "stock > 0",
        notes: "Routes in-stock orders directly to fulfillment.",
      },
    },
    {
      id: "node-4",
      type: "Action",
      name: "Reserve Inventory",
      position: { x: 1212, y: 172 },
      config: {
        operation: "inventory.reserve",
        notes: "Commits stock and posts status back to Shopify.",
      },
    },
  ],
};

const libraryEntries: LibraryEntry[] = [
  { id: "trigger-order", group: "Triggers", label: "New Order", description: "Start when a new order is received from Shopify.", type: "Trigger", value: "shopify.order.created", notes: "Listens for new order events from the commerce platform." },
  { id: "trigger-webhook", group: "Triggers", label: "Webhook", description: "Start from an external webhook payload.", type: "Trigger", value: "external.webhook.received", notes: "Use for third-party events entering the workflow engine." },
  { id: "trigger-scheduled", group: "Triggers", label: "Scheduled", description: "Run on a recurring schedule or delivery window.", type: "Trigger", value: "scheduler.every_hour", notes: "Useful for recurring audits and daily operational checks." },
  { id: "agent-sentiment", group: "AI Agents", label: "Sentiment Scan", description: "Analyze tone and risk signals across conversations.", type: "Condition", value: "sentiment_score < 0.35", notes: "Escalate negative sentiment before SLA risk increases." },
  { id: "agent-route", group: "AI Agents", label: "Route Optimizer", description: "Recommend the best queue or team assignment.", type: "Condition", value: "account_tier == 'vip'", notes: "Route high-value accounts to the priority response queue." },
  { id: "agent-draft", group: "AI Agents", label: "Draft Content", description: "Generate a proposed response or update draft.", type: "Action", value: "draft_response:order_update", notes: "Prepare a customer-safe response for review or automation." },
  { id: "agent-extract", group: "AI Agents", label: "Data Extractor", description: "Extract structured entities from customer requests.", type: "Action", value: "extract_entities:order_fields", notes: "Capture order ID, issue type, and urgency from free text." },
  { id: "action-assign", group: "Standard Actions", label: "Assign Queue", description: "Route the workflow to a support or logistics queue.", type: "Action", value: "assign_queue:ops-tier-2", notes: "Send the item to the appropriate team for execution." },
  { id: "action-notify", group: "Standard Actions", label: "Send Alert", description: "Notify operators or merchants about a workflow event.", type: "Action", value: "notify:merchant", notes: "Send an alert when automation needs attention." },
  { id: "action-review", group: "Standard Actions", label: "Manual Review", description: "Pause the workflow and create a review task.", type: "Action", value: "create_review_task", notes: "Use for edge cases that require human approval." },
];

function cloneNodes(nodes: WorkflowNode[]) {
  return nodes.map((node) => ({
    ...node,
    config: { ...node.config },
    position: node.position ? { ...node.position } : undefined,
  }));
}

function cloneWorkflow(workflow: Workflow): Workflow {
  return { ...workflow, nodes: cloneNodes(workflow.nodes) };
}

function workflowSnapshot(name: string, description: string, nodes: WorkflowNode[]) {
  return JSON.stringify({ name, description, nodes });
}

function normalizeInitialWorkflow(stored: Workflow | null) {
  if (!stored) return cloneWorkflow(referenceWorkflow);
  if (
    stored.id === mockWorkflowTemplate.id ||
    stored.name === mockWorkflowTemplate.name ||
    stored.name === "Customer Support Intake"
  ) {
    return cloneWorkflow(referenceWorkflow);
  }
  return cloneWorkflow(stored);
}

function defaultNodeConfig(type: WorkflowNodeType): WorkflowNode["config"] {
  if (type === "Trigger") return { eventKey: "", notes: "" };
  if (type === "Condition") return { rule: "", notes: "" };
  return { operation: "", notes: "" };
}

function nextNodePosition(nodes: WorkflowNode[]) {
  const last = [...nodes].reverse().find((node) => node.position);
  if (!last?.position) return { x: 84, y: 172 };
  return { x: last.position.x + 376, y: last.position.y };
}

function createNodeFromLibrary(entry: LibraryEntry, nodes: WorkflowNode[]) {
  const node: WorkflowNode = {
    id: `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: entry.type,
    name: entry.label,
    config: defaultNodeConfig(entry.type),
    position: nextNodePosition(nodes),
  };

  if (entry.type === "Trigger") node.config = { eventKey: entry.value, notes: entry.notes };
  if (entry.type === "Condition") node.config = { rule: entry.value, notes: entry.notes };
  if (entry.type === "Action") node.config = { operation: entry.value, notes: entry.notes };

  return node;
}

function primaryConfigLabel(type: WorkflowNodeType) {
  if (type === "Trigger") return "Input Source";
  if (type === "Condition") return "Rule Logic";
  return "Operation";
}

function primaryConfigPlaceholder(type: WorkflowNodeType) {
  if (type === "Trigger") return "Store API v2";
  if (type === "Condition") return "stock > 0";
  return "inventory.reserve";
}

function primaryConfigValue(node: WorkflowNode) {
  if (node.type === "Trigger") return node.config.eventKey ?? "";
  if (node.type === "Condition") return node.config.rule ?? "";
  return node.config.operation ?? "";
}

function applyPrimaryConfigValue(node: WorkflowNode, value: string): WorkflowNode {
  if (node.type === "Trigger") return { ...node, config: { ...node.config, eventKey: value } };
  if (node.type === "Condition") return { ...node, config: { ...node.config, rule: value } };
  return { ...node, config: { ...node.config, operation: value } };
}

function nodeTypeVariant(type: WorkflowNodeType) {
  if (type === "Trigger") return "info";
  if (type === "Condition") return "warning";
  return "success";
}

function nodeSummary(node: WorkflowNode) {
  return node.config.notes?.trim() || primaryConfigValue(node) || "Add node details";
}

function isConfigured(node: WorkflowNode) {
  return primaryConfigValue(node).trim().length > 0;
}

function nodeDetailCopy(node: WorkflowNode | null) {
  if (!node) return "";
  if (node.type === "Trigger") return "Modify input parameters and output conditions for this specific operational node.";
  if (node.type === "Condition") return "Configure decision logic and routing behavior for this branch in the workflow.";
  return "Adjust execution settings and automation behavior for this operational action.";
}

function NodeGlyph({ type }: { type: WorkflowNodeType }) {
  if (type === "Trigger") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="6" y="4" width="12" height="16" rx="3" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
      </svg>
    );
  }
  if (type === "Condition") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 3l8 9-8 9-8-9 8-9z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    </svg>
  );
}

export default function WorkflowBuilderPage() {
  const session = useMockSession();
  const [workflowId, setWorkflowId] = useState(referenceWorkflow.id);
  const [workflowName, setWorkflowName] = useState(referenceWorkflow.name);
  const [workflowDescription, setWorkflowDescription] = useState(referenceWorkflow.description ?? "");
  const [nodes, setNodes] = useState<WorkflowNode[]>(() => cloneNodes(referenceWorkflow.nodes));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(referenceWorkflow.nodes[0]?.id ?? null);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    workflowSnapshot(referenceWorkflow.name, referenceWorkflow.description ?? "", referenceWorkflow.nodes),
  );
  const [librarySearch, setLibrarySearch] = useState("");
  const [templateSelection, setTemplateSelection] = useState("");
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(1);
  const [cursorMode, setCursorMode] = useState<"select" | "pan">("select");
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const hydrateWorkflow = () => {
      const source = normalizeInitialWorkflow(readStoredWorkflow());
      setWorkflowId(source.id);
      setWorkflowName(source.name);
      setWorkflowDescription(source.description ?? "");
      setNodes(source.nodes);
      setSelectedNodeId(source.nodes[0]?.id ?? null);
      setSavedSnapshot(workflowSnapshot(source.name, source.description ?? "", source.nodes));
      setTemplateSelection("");
      setLastSavedAt(null);
      setLastTestedAt(null);
      setPublishedAt(null);
    };

    hydrateWorkflow();
    window.addEventListener(demoDataResetEvent, hydrateWorkflow);
    return () => window.removeEventListener(demoDataResetEvent, hydrateWorkflow);
  }, []);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2800);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const selectedNodeIndex = selectedNode ? nodes.findIndex((node) => node.id === selectedNode.id) : -1;
  const previousNode = selectedNodeIndex > 0 ? nodes[selectedNodeIndex - 1] : null;
  const nextNode =
    selectedNodeIndex >= 0 && selectedNodeIndex < nodes.length - 1 ? nodes[selectedNodeIndex + 1] : null;

  const hasUnsavedChanges = useMemo(
    () => workflowSnapshot(workflowName, workflowDescription, nodes) !== savedSnapshot,
    [nodes, savedSnapshot, workflowDescription, workflowName],
  );
  const publishReadyPercent = nodes.length === 0 ? 0 : Math.round((nodes.filter(isConfigured).length / nodes.length) * 100);
  const zoomLevel = ZOOM_LEVELS[zoomIndex];
  const zoomPercent = Math.round(zoomLevel * 100);
  const canvasWidth = Math.max(1280, nodes.reduce((max, node) => Math.max(max, (node.position?.x ?? 0) + NODE_WIDTH + 120), 0));
  const canvasHeight = 540;

  const filteredGroups = useMemo(() => {
    const query = librarySearch.trim().toLowerCase();
    return (["Triggers", "AI Agents", "Standard Actions"] as const)
      .map((group) => ({
        group,
        items: libraryEntries.filter((entry) => {
          if (entry.group !== group) return false;
          if (!query) return true;
          return `${entry.label} ${entry.description}`.toLowerCase().includes(query);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [librarySearch]);

  const saveWorkflow = (message = "Workflow saved.") => {
    const normalizedName = workflowName.trim() || "Untitled Workflow";
    const normalizedDescription = workflowDescription.trim();
    writeStoredWorkflow({
      id: workflowId,
      name: normalizedName,
      description: normalizedDescription || undefined,
      nodes: cloneNodes(nodes),
    });
    setWorkflowName(normalizedName);
    setWorkflowDescription(normalizedDescription);
    setSavedSnapshot(workflowSnapshot(normalizedName, normalizedDescription, nodes));
    setLastSavedAt(new Date().toLocaleTimeString());
    setToastMessage(message);
    setToastOpen(true);
  };

  const applyTemplateById = (templateId: string) => {
    const template = [referenceWorkflow, ...mockWorkflowTemplates].find((item) => item.id === templateId);
    if (!template) return;
    const source = cloneWorkflow(template);
    setWorkflowId(source.id);
    setWorkflowName(source.name);
    setWorkflowDescription(source.description ?? "");
    setNodes(source.nodes);
    setSelectedNodeId(source.nodes[0]?.id ?? null);
    setSavedSnapshot(workflowSnapshot(source.name, source.description ?? "", source.nodes));
    setTemplateSelection("");
    setLastSavedAt(null);
    setLastTestedAt(null);
    setPublishedAt(null);
    setToastMessage(`Loaded template: ${source.name}`);
    setToastOpen(true);
  };

  const resetWorkflow = () => {
    clearStoredWorkflow();
    const source = cloneWorkflow(referenceWorkflow);
    setWorkflowId(source.id);
    setWorkflowName(source.name);
    setWorkflowDescription(source.description ?? "");
    setNodes(source.nodes);
    setSelectedNodeId(source.nodes[0]?.id ?? null);
    setSavedSnapshot(workflowSnapshot(source.name, source.description ?? "", source.nodes));
    setLastSavedAt(null);
    setLastTestedAt(null);
    setPublishedAt(null);
    setResetOpen(false);
    setToastMessage("Workflow reset.");
    setToastOpen(true);
  };

  const cloneSelectedNode = () => {
    if (!selectedNode) return;
    const clone: WorkflowNode = {
      ...selectedNode,
      id: `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${selectedNode.name} Copy`,
      config: { ...selectedNode.config },
      position: nextNodePosition(nodes),
    };
    setNodes((prev) => [...prev, clone]);
    setSelectedNodeId(clone.id);
  };

  if (!hasFeatureAccess(session, "workflowBuilder")) {
    return (
      <div className="space-y-6">
        <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />
        <Card className="rounded-[28px] border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Workflow Builder</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">{featureRequirements.workflowBuilder.description}</p>
          <button
            className="mt-6 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
            onClick={() => {
              saveMockSession({ ...session, plan: "pro" });
              setToastMessage("Mock plan switched to pro.");
              setToastOpen(true);
            }}
            type="button"
          >
            Upgrade to Pro
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="-m-4 lg:-m-6">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <div className="overflow-hidden border-y border-slate-200 bg-white">
        <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 xl:[grid-template-columns:360px_minmax(760px,_1fr)_360px] xl:[grid-template-rows:70px_minmax(760px,_1fr)]">
          <aside className="flex flex-col border-b border-slate-200 bg-white xl:row-span-2 xl:border-b-0 xl:border-r">
            <div className="border-b border-slate-200 px-5 py-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl text-sky-600">+</span>
                <p className="text-xl font-semibold tracking-tight text-slate-950">Node Library</p>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input
                  className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  onChange={(event) => setLibrarySearch(event.target.value)}
                  placeholder="Search components..."
                  type="text"
                  value={librarySearch}
                />
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
              {filteredGroups.map((section) => (
                <div key={section.group}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-700">{section.group}</h2>
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    {section.items.map((entry) => (
                      <button
                        key={entry.id}
                        className="flex w-full items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                        onClick={() => {
                          const nextNode = createNodeFromLibrary(entry, nodes);
                          setNodes((prev) => [...prev, nextNode]);
                          setSelectedNodeId(nextNode.id);
                        }}
                        type="button"
                      >
                        <span className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm">
                          <NodeGlyph type={entry.type} />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{entry.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{entry.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 bg-sky-50/70 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Pro Tip</p>
              <p className="mt-3 text-sm text-slate-600">
                Hold <span className="rounded bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm">Shift</span> while selecting nodes to prepare multi-step workflow edits later.
              </p>
            </div>
          </aside>

          <div className="border-b border-slate-200 bg-white xl:col-start-2 xl:row-start-1">
            <div className="flex h-full flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-[1.35rem] font-semibold tracking-tight text-slate-950">{workflowName}</h1>
                    <span className="text-[1.35rem] font-semibold tracking-tight text-slate-400">{WORKFLOW_VERSION}</span>
                    <Badge variant={publishedAt ? "success" : "info"}>{publishedAt ? "Active" : "Draft"}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>{lastSavedAt ? `Last edited ${lastSavedAt} by Sarah` : "Last edited 2m ago by Sarah"}</span>
                    <span>{nodes.length} nodes</span>
                    <span>{publishReadyPercent}% automation ready</span>
                    {lastTestedAt ? <span>Last tested {lastTestedAt}</span> : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                  onChange={(event) => {
                    const templateId = event.target.value;
                    setTemplateSelection(templateId);
                    if (!templateId) return;
                    if (hasUnsavedChanges) {
                      setPendingTemplateId(templateId);
                      return;
                    }
                    applyTemplateById(templateId);
                  }}
                  value={templateSelection}
                >
                  <option value="">Load template</option>
                  {[referenceWorkflow, ...mockWorkflowTemplates].map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    className={`rounded-xl px-3 py-2 text-sm ${cursorMode === "select" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                    onClick={() => setCursorMode("select")}
                    type="button"
                  >
                    Select
                  </button>
                  <button
                    className={`rounded-xl px-3 py-2 text-sm ${cursorMode === "pan" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                    onClick={() => setCursorMode("pan")}
                    type="button"
                  >
                    Pan
                  </button>
                </div>

                <button className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2" onClick={() => saveWorkflow()} type="button">Save</button>
                <button
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 disabled:opacity-60"
                  disabled={isTesting}
                  onClick={() => {
                    setIsTesting(true);
                    window.setTimeout(() => {
                      setIsTesting(false);
                      setLastTestedAt(new Date().toLocaleTimeString());
                      setToastMessage("Test flow completed successfully.");
                      setToastOpen(true);
                    }, 900);
                  }}
                  type="button"
                >
                  {isTesting ? "Testing..." : "Test Flow"}
                </button>
                <button
                  className="rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                  onClick={() => {
                    saveWorkflow("Workflow published.");
                    setPublishedAt(new Date().toLocaleTimeString());
                  }}
                  type="button"
                >
                  Publish
                </button>
                <button className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2" onClick={() => setResetOpen(true)} type="button">Reset</button>
              </div>
            </div>
          </div>

          <main className="relative overflow-hidden bg-[#fcfdff] xl:col-start-2 xl:row-start-2">
            <div className="h-full overflow-auto p-8">
              <div style={{ height: canvasHeight * zoomLevel, width: canvasWidth * zoomLevel }}>
                <div className="relative origin-top-left" style={{ height: canvasHeight, width: canvasWidth, transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}>
                  <svg className="pointer-events-none absolute inset-0 h-full w-full" fill="none">
                    {nodes.slice(0, -1).map((node, index) => {
                      const next = nodes[index + 1];
                      const startX = (node.position?.x ?? 0) + NODE_WIDTH;
                      const endX = next.position?.x ?? 0;
                      const y = (node.position?.y ?? 0) + NODE_HEIGHT / 2;
                      return <path key={`${node.id}-${next.id}`} d={`M ${startX} ${y} C ${startX + 80} ${y}, ${endX - 80} ${y}, ${endX} ${y}`} stroke="#2596ff" strokeOpacity="0.55" strokeWidth="3" />;
                    })}
                  </svg>

                  {nodes.map((node) => {
                    const selected = node.id === selectedNodeId;
                    return (
                      <button
                        key={node.id}
                        className={`absolute rounded-[26px] border bg-white px-6 py-5 text-left shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 ${selected ? "border-sky-500 shadow-[0_18px_42px_rgba(37,150,255,0.18)] ring-2 ring-sky-100" : "border-slate-200"}`}
                        onClick={() => setSelectedNodeId(node.id)}
                        style={{ left: node.position?.x ?? 0, top: node.position?.y ?? 0, width: NODE_WIDTH }}
                        type="button"
                      >
                        <span className={`absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 bg-white ${selected ? "border-sky-500" : "border-slate-300"}`} />
                        <span className={`absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 bg-white ${selected ? "border-sky-500" : "border-slate-300"}`} />
                        <div className="flex items-start gap-4">
                          <span className={`rounded-xl p-2 ${selected ? "bg-sky-50 text-sky-600" : "bg-slate-50 text-slate-500"}`}><NodeGlyph type={node.type} /></span>
                          <div>
                            <p className="text-[1.3rem] font-semibold tracking-tight text-slate-950">{node.name}</p>
                            <p className="mt-2 max-w-[180px] text-sm leading-6 text-slate-600">{nodeSummary(node)}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 right-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-lg">
              <button className="text-xl text-slate-500" disabled={zoomIndex === 0} onClick={() => setZoomIndex((value) => Math.max(0, value - 1))} type="button">-</button>
              <span className="text-sm font-semibold text-slate-800">{zoomPercent}%</span>
              <button className="text-xl text-slate-500" disabled={zoomIndex === ZOOM_LEVELS.length - 1} onClick={() => setZoomIndex((value) => Math.min(ZOOM_LEVELS.length - 1, value + 1))} type="button">+</button>
            </div>
          </main>

          <aside className="flex flex-col border-t border-slate-200 bg-white xl:row-span-2 xl:border-l xl:border-t-0">
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="flex items-center justify-between">
                <Badge variant="info" className="px-4 py-2">Configuration</Badge>
                <button className="text-sm text-slate-400 transition hover:text-red-600" onClick={() => {
                  if (!selectedNodeId) return;
                  const remaining = nodes.filter((node) => node.id !== selectedNodeId);
                  setNodes(remaining);
                  setSelectedNodeId(remaining[0]?.id ?? null);
                }} type="button">Remove</button>
              </div>
              <h2 className="mt-6 text-[2rem] font-semibold tracking-tight text-slate-950">{selectedNode?.name ?? "Select a Node"}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{nodeDetailCopy(selectedNode)}</p>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              {!selectedNode ? (
                <EmptyState title="Select a node" description="Choose a node from the canvas to view and update its settings." />
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Node Identifier</label>
                    <input className={fieldClasses} readOnly type="text" value={selectedNode.id} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{primaryConfigLabel(selectedNode.type)}</label>
                    <div className={`${fieldClasses} flex items-center justify-between gap-3`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-sky-500" />
                        <input
                          className="w-full min-w-0 bg-transparent text-sm text-slate-700 focus:outline-none"
                          onChange={(event) => setNodes((prev) => prev.map((node) => node.id === selectedNode.id ? applyPrimaryConfigValue(node, event.target.value) : node))}
                          placeholder={primaryConfigPlaceholder(selectedNode.type)}
                          type="text"
                          value={primaryConfigValue(selectedNode)}
                        />
                      </div>
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4 flex-none text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Node Notes</label>
                    <textarea
                      className={`${fieldClasses} min-h-32`}
                      onChange={(event) => setNodes((prev) => prev.map((node) => node.id === selectedNode.id ? { ...node, config: { ...node.config, notes: event.target.value } } : node))}
                      value={selectedNode.config.notes ?? ""}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workflow Context</p>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="flex items-center justify-between"><span>Connected from</span><span className="font-medium text-slate-900">{previousNode?.name ?? "Canvas entry point"}</span></div>
                      <div className="flex items-center justify-between"><span>Routes to</span><span className="font-medium text-slate-900">{nextNode?.name ?? "End of flow"}</span></div>
                      <div className="flex items-center justify-between"><span>Validation</span><span className={`font-medium ${isConfigured(selectedNode) ? "text-emerald-600" : "text-amber-600"}`}>{isConfigured(selectedNode) ? "Configured" : "Needs input"}</span></div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-5">
              <div className="flex gap-3">
                <button className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2" onClick={cloneSelectedNode} type="button">Clone</button>
                <button className="flex-1 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2" onClick={() => saveWorkflow("Node configuration updated.")} type="button">Update</button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={pendingTemplateId !== null}
        title="Discard changes and load template?"
        onClose={() => {
          setPendingTemplateId(null);
          setTemplateSelection("");
        }}
        footer={
          <>
            <button className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2" onClick={() => {
              setPendingTemplateId(null);
              setTemplateSelection("");
            }} type="button">Cancel</button>
            <button className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2" onClick={() => {
              if (pendingTemplateId) applyTemplateById(pendingTemplateId);
              setPendingTemplateId(null);
            }} type="button">Discard and Load</button>
          </>
        }
      >
        <p className="text-sm text-gray-700">Your current workflow has unsaved changes. Loading a template will replace the active canvas.</p>
      </Modal>

      <Modal
        open={resetOpen}
        title="Reset Workflow"
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <button className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2" onClick={() => setResetOpen(false)} type="button">Cancel</button>
            <button className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2" onClick={resetWorkflow} type="button">Continue</button>
          </>
        }
      >
        <p className="text-sm text-gray-700">This will restore the reference-style demo workflow and clear saved edits.</p>
      </Modal>
    </div>
  );
}
