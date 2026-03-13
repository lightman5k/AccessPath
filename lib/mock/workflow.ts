import type { Workflow } from "@/types";

export const customerSupportIntakeTemplate: Workflow = {
  id: "wf-customer-support-intake-001",
  name: "Customer Support Intake",
  description: "Triage inbound support requests for escalation or resolution.",
  nodes: [
    {
      id: "node-cs-trigger-1",
      type: "Trigger",
      name: "Ticket Submitted",
      position: { x: 80, y: 120 },
      config: {
        eventKey: "support.ticket.created",
        notes: "Starts when a new support ticket is created.",
      },
    },
    {
      id: "node-cs-condition-1",
      type: "Condition",
      name: "Urgency Check",
      position: { x: 360, y: 120 },
      config: {
        rule: "priority == 'high'",
        notes: "Routes urgent tickets for expedited handling.",
      },
    },
    {
      id: "node-cs-action-1",
      type: "Action",
      name: "Assign Tier-2 Queue",
      position: { x: 640, y: 120 },
      config: {
        operation: "assign_queue:tier-2",
        notes: "Escalate urgent items to Tier-2 agents.",
      },
    },
  ],
};

export const orderStatusAutomationTemplate: Workflow = {
  id: "wf-order-status-automation-001",
  name: "Order Status Automation",
  description: "Automatically notify customers when order status changes.",
  nodes: [
    {
      id: "node-order-trigger-1",
      type: "Trigger",
      name: "Order Updated",
      position: { x: 80, y: 120 },
      config: {
        eventKey: "order.status.updated",
        notes: "Receives shipment and fulfillment updates.",
      },
    },
    {
      id: "node-order-action-1",
      type: "Action",
      name: "Send Status Email",
      position: { x: 360, y: 120 },
      config: {
        operation: "send_email:order_status",
        notes: "Sends the latest status notification to the customer.",
      },
    },
  ],
};

export const mockWorkflowTemplates: Workflow[] = [
  customerSupportIntakeTemplate,
  orderStatusAutomationTemplate,
];

export const mockWorkflowTemplate: Workflow = customerSupportIntakeTemplate;
