"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, EmptyState, Modal, PageHeader, Toast } from "@/components/ui";
import { clearStoredWorkflow, defaultStoredWorkflow, readStoredWorkflow, writeStoredWorkflow } from "@/lib";
import {
  demoDataResetEvent,
  featureRequirements,
  hasFeatureAccess,
  mockWorkflowTemplate,
  mockWorkflowTemplates,
  saveMockSession,
  useMockSession,
} from "@/lib/mock";
import type { WorkflowNode, WorkflowNodeType } from "@/types";

function defaultNodeConfig(type: WorkflowNodeType): WorkflowNode["config"] {
  if (type === "Trigger") return { eventKey: "", notes: "" };
  if (type === "Condition") return { rule: "", notes: "" };
  return { operation: "", notes: "" };
}

function createNode(type: WorkflowNodeType, count: number): WorkflowNode {
  return {
    id: `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    name: `${type} ${count}`,
    config: defaultNodeConfig(type),
  };
}

function primaryConfigLabel(type: WorkflowNodeType) {
  if (type === "Trigger") return "Event Key";
  if (type === "Condition") return "Rule";
  return "Operation";
}

function primaryConfigValue(node: WorkflowNode) {
  if (node.type === "Trigger") return node.config.eventKey ?? "";
  if (node.type === "Condition") return node.config.rule ?? "";
  return node.config.operation ?? "";
}

function applyPrimaryConfigValue(node: WorkflowNode, value: string): WorkflowNode {
  if (node.type === "Trigger") {
    return { ...node, config: { ...node.config, eventKey: value } };
  }
  if (node.type === "Condition") {
    return { ...node, config: { ...node.config, rule: value } };
  }
  return { ...node, config: { ...node.config, operation: value } };
}

const nodeLibrary: Array<{ type: WorkflowNodeType; description: string }> = [
  { type: "Trigger", description: "Starts a workflow from an event." },
  { type: "Condition", description: "Routes based on a rule check." },
  { type: "Action", description: "Performs an outbound step." },
];

function typeTone(type: WorkflowNodeType) {
  if (type === "Trigger") return "bg-green-100 text-green-700";
  if (type === "Condition") return "bg-amber-100 text-amber-700";
  return "bg-blue-100 text-blue-700";
}

function cloneNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  return nodes.map((node) => ({
    ...node,
    config: { ...node.config },
    position: node.position ? { ...node.position } : undefined,
  }));
}

function defaultWorkflowNodes() {
  return cloneNodes(defaultStoredWorkflow().nodes);
}

export default function WorkflowBuilderPage() {
  const session = useMockSession();
  const [nodes, setNodes] = useState<WorkflowNode[]>(() => cloneNodes(mockWorkflowTemplate.nodes));
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(mockWorkflowTemplate.nodes),
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [templateSelection, setTemplateSelection] = useState("");
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    const hydrateWorkflow = () => {
      const storedWorkflow = readStoredWorkflow();
      if (!storedWorkflow) {
        const defaultNodes = defaultWorkflowNodes();
        setNodes(defaultNodes);
        setSavedSnapshot(JSON.stringify(defaultNodes));
        setSelectedNodeId(null);
        setTemplateSelection("");
        setLastSavedAt(null);
        return;
      }
      setNodes(cloneNodes(storedWorkflow.nodes));
      setSavedSnapshot(JSON.stringify(storedWorkflow.nodes));
      setSelectedNodeId(null);
      setTemplateSelection("");
      setLastSavedAt(null);
    };

    hydrateWorkflow();
    window.addEventListener(demoDataResetEvent, hydrateWorkflow);
    return () => window.removeEventListener(demoDataResetEvent, hydrateWorkflow);
  }, []);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(nodes) !== savedSnapshot,
    [nodes, savedSnapshot],
  );

  const applyTemplateById = (templateId: string) => {
    const template = mockWorkflowTemplates.find((item) => item.id === templateId);
    if (!template) return;
    const templateNodes = cloneNodes(template.nodes);
    setNodes(templateNodes);
    setSelectedNodeId(null);
    setSavedSnapshot(JSON.stringify(templateNodes));
    setToastMessage(`Loaded template: ${template.name}`);
    setToastOpen(true);
  };

  const requestTemplateLoad = (templateId: string) => {
    if (!templateId) return;
    if (hasUnsavedChanges) {
      setPendingTemplateId(templateId);
      return;
    }
    applyTemplateById(templateId);
  };

  const addNode = (type: WorkflowNodeType) => {
    const createdCount = nodes.filter((node) => node.type === type).length + 1;
    const newNode = createNode(type, createdCount);
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const updateSelectedNode = (updater: (node: WorkflowNode) => WorkflowNode) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((node) => (node.id === selectedNodeId ? updater(node) : node)),
    );
  };

  const renameSelectedNode = (name: string) => {
    updateSelectedNode((node) => ({ ...node, name }));
  };

  const updateSelectedNodeNotes = (notes: string) => {
    updateSelectedNode((node) => ({
      ...node,
      config: { ...node.config, notes },
    }));
  };

  const updateSelectedNodePrimaryConfig = (value: string) => {
    updateSelectedNode((node) => applyPrimaryConfigValue(node, value));
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.filter((node) => node.id !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const saveWorkflow = () => {
    writeStoredWorkflow({
      ...mockWorkflowTemplate,
      nodes,
    });
    setSavedSnapshot(JSON.stringify(nodes));
    setLastSavedAt(new Date().toLocaleTimeString());
  };

  const resetWorkflow = () => {
    clearStoredWorkflow();
    const defaultNodes = defaultWorkflowNodes();
    setNodes(defaultNodes);
    setSavedSnapshot(JSON.stringify(defaultNodes));
    setSelectedNodeId(null);
    setPendingTemplateId(null);
    setTemplateSelection("");
    setLastSavedAt(null);
    setResetOpen(false);
    setToastMessage("Workflow reset.");
    setToastOpen(true);
  };

  if (!hasFeatureAccess(session, "workflowBuilder")) {
    return (
      <div className="space-y-6">
        <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />
        <PageHeader
          title="Workflow Builder"
          description="Add, select, and configure workflow nodes."
        />
        <Card>
          <div className="space-y-3">
            <EmptyState
              description={featureRequirements.workflowBuilder.description}
              title="Workflow Builder is locked"
            />
            <button
              className="rounded-md border border-indigo-300 px-3 py-2 text-sm text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
              onClick={() => {
                saveMockSession({ ...session, plan: "pro" });
                setToastMessage("Mock plan switched to pro.");
                setToastOpen(true);
              }}
              type="button"
            >
              Upgrade to Pro
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast
        message={toastMessage}
        onClose={() => setToastOpen(false)}
        open={toastOpen}
      />
      <PageHeader
        title="Workflow Builder"
        description="Add, select, and configure workflow nodes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600" htmlFor="template-picker">
              Templates
            </label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              id="template-picker"
              onChange={(event) => {
                const templateId = event.target.value;
                setTemplateSelection("");
                requestTemplateLoad(templateId);
              }}
              value={templateSelection}
            >
              <option value="">Select template</option>
              {mockWorkflowTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {lastSavedAt ? (
              <span className="text-xs text-gray-500">Saved at {lastSavedAt}</span>
            ) : null}
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={saveWorkflow}
              type="button"
            >
              Save
            </button>
            <button
              className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
              onClick={() => setResetOpen(true)}
              type="button"
            >
              Reset
            </button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card as="aside" className="xl:col-span-3">
          <h2 className="text-lg font-semibold">Node Library</h2>
          <p className="mt-1 text-sm text-gray-600">Click a node type to add it.</p>
          <ul className="mt-4 space-y-3">
            {nodeLibrary.map((item) => (
              <li key={item.type}>
                <button
                  className="w-full rounded-md border border-gray-200 bg-gray-50 p-3 text-left transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  onClick={() => addNode(item.type)}
                  type="button"
                >
                  <p className="text-sm font-medium text-gray-900">{item.type}</p>
                  <p className="mt-1 text-xs text-gray-600">{item.description}</p>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card as="article" className="xl:col-span-6">
          <h2 className="text-lg font-semibold">Canvas</h2>
          <p className="mt-1 text-sm text-gray-600">
            Nodes appear in creation order. Drag/drop comes later.
          </p>

          <div className="mt-4 rounded-md border border-gray-200 bg-[linear-gradient(to_right,rgba(17,24,39,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,24,39,0.06)_1px,transparent_1px)] bg-[size:24px_24px] p-3">
            {nodes.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-300 bg-white/80 p-6 text-sm text-gray-600">
                No nodes yet. Add one from the library.
              </div>
            ) : (
              <ul className="space-y-3">
                {nodes.map((node) => {
                  const isSelected = node.id === selectedNodeId;
                  return (
                    <li key={node.id}>
                      <button
                        className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
                          isSelected
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedNodeId(node.id)}
                        type="button"
                      >
                        <div>
                          <p className="text-sm font-medium">{node.name}</p>
                          <p
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              isSelected ? "bg-white/20 text-white" : typeTone(node.type)
                            }`}
                          >
                            {node.type}
                          </p>
                        </div>
                        <span className="text-xs opacity-70">{node.id}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card as="aside" className="xl:col-span-3">
          <h2 className="text-lg font-semibold">Node Config</h2>
          {!selectedNode ? (
            <p className="mt-4 text-sm text-gray-600">Select a node to configure it.</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Type</p>
                <p className="mt-1 text-sm text-gray-900">{selectedNode.type}</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500" htmlFor="node-name">
                  Name
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  id="node-name"
                  onChange={(event) => renameSelectedNode(event.target.value)}
                  type="text"
                  value={selectedNode.name}
                />
              </div>
              <div>
                <label
                  className="text-xs uppercase tracking-wide text-gray-500"
                  htmlFor="node-primary-config"
                >
                  {primaryConfigLabel(selectedNode.type)}
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  id="node-primary-config"
                  onChange={(event) => updateSelectedNodePrimaryConfig(event.target.value)}
                  type="text"
                  value={primaryConfigValue(selectedNode)}
                />
              </div>
              <div>
                <label
                  className="text-xs uppercase tracking-wide text-gray-500"
                  htmlFor="node-notes"
                >
                  Notes
                </label>
                <textarea
                  className="mt-1 min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                  id="node-notes"
                  onChange={(event) => updateSelectedNodeNotes(event.target.value)}
                  value={selectedNode.config.notes ?? ""}
                />
              </div>
              <button
                className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
                onClick={deleteSelectedNode}
                type="button"
              >
                Delete Node
              </button>
            </div>
          )}
        </Card>
      </section>

      <Modal
        open={pendingTemplateId !== null}
        title="Discard changes and load template?"
        onClose={() => setPendingTemplateId(null)}
        footer={
          <>
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => setPendingTemplateId(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
              onClick={() => {
                if (pendingTemplateId) applyTemplateById(pendingTemplateId);
                setPendingTemplateId(null);
              }}
              type="button"
            >
              Discard and Load
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Your current workflow has unsaved changes. This will replace the canvas with
          the selected template.
        </p>
      </Modal>

      <Modal
        open={resetOpen}
        title="Reset Workflow"
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => setResetOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
              onClick={resetWorkflow}
              type="button"
            >
              Continue
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          This will clear your saved workflow. Continue?
        </p>
      </Modal>
    </div>
  );
}
