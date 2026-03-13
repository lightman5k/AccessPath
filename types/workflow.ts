export type WorkflowNodeType = "Trigger" | "Condition" | "Action";

type WorkflowNodeConfigBase = {
  notes?: string;
};

export type TriggerNodeConfig = WorkflowNodeConfigBase & {
  eventKey?: string;
};

export type ConditionNodeConfig = WorkflowNodeConfigBase & {
  rule?: string;
};

export type ActionNodeConfig = WorkflowNodeConfigBase & {
  operation?: string;
};

export type WorkflowNodeConfigMap = {
  Trigger: TriggerNodeConfig;
  Condition: ConditionNodeConfig;
  Action: ActionNodeConfig;
};

export type WorkflowNode<T extends WorkflowNodeType = WorkflowNodeType> =
  T extends WorkflowNodeType
    ? {
        id: string;
        type: T;
        name: string;
        config: WorkflowNodeConfigMap[T];
        position?: { x: number; y: number };
      }
    : never;

export type Workflow = {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
};
