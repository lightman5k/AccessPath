import { mockWorkflowTemplate } from "@/lib/mock/workflow";
import type { Workflow } from "@/types";

export const workflowStorageKey = "workflow-builder:workflow:v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readStoredWorkflow(): Workflow | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(workflowStorageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.nodes)) return null;
    return parsed as Workflow;
  } catch {
    return null;
  }
}

export function writeStoredWorkflow(workflow: Workflow) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(workflowStorageKey, JSON.stringify(workflow));
}

export function clearStoredWorkflow() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(workflowStorageKey);
}

export function defaultStoredWorkflow(): Workflow {
  return {
    ...mockWorkflowTemplate,
    nodes: mockWorkflowTemplate.nodes,
  };
}
