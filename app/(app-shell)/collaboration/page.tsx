"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, PageHeader, Toast } from "@/components/ui";

type WorkspaceColumn = "todo" | "in-progress" | "done";
type Priority = "High" | "Medium" | "Low";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarClass: string;
};

type TaskItem = {
  id: string;
  title: string;
  description: string;
  column: WorkspaceColumn;
  priority: Priority;
  assigneeId: string;
  comments: number;
};

type ActivityItem = {
  id: string;
  actor: string;
  actorInitials: string;
  actorClass: string;
  text: string;
  target: string;
  timeAgo: string;
};

const teamMembers: TeamMember[] = [
  { id: "sarah", name: "Sarah Chen", role: "Operations Lead", initials: "SC", avatarClass: "from-rose-400 to-pink-500" },
  { id: "james", name: "James Wilson", role: "Finance Ops", initials: "JW", avatarClass: "from-slate-500 to-slate-700" },
  { id: "system", name: "System AI", role: "Automation Agent", initials: "AI", avatarClass: "from-sky-500 to-blue-700" },
  { id: "elena", name: "Elena Rodriguez", role: "Customer Support", initials: "ER", avatarClass: "from-amber-400 to-orange-500" },
  { id: "david", name: "David Park", role: "Integrations Manager", initials: "DP", avatarClass: "from-emerald-400 to-teal-600" },
];

const initialTasks: TaskItem[] = [
  {
    id: "task-1",
    title: "Review AI Customer Logs",
    description: "Analyze sentiment trends from the last 24h AI chatbot logs for emerging escalation themes.",
    column: "todo",
    priority: "High",
    assigneeId: "sarah",
    comments: 4,
  },
  {
    id: "task-2",
    title: "Team Training Session",
    description: "Host a walkthrough for the new Workflow Automation nodes with support and logistics leads.",
    column: "todo",
    priority: "Low",
    assigneeId: "elena",
    comments: 0,
  },
  {
    id: "task-3",
    title: "Update Logistics API",
    description: "Ensure the new UPS integration is mapping correctly to the shared fleet dashboard and dispatch rules.",
    column: "in-progress",
    priority: "Medium",
    assigneeId: "david",
    comments: 2,
  },
  {
    id: "task-4",
    title: "Q3 Cost Savings Report",
    description: "Finalize the AI-driven ROI report for leadership review with updated automation impact totals.",
    column: "done",
    priority: "High",
    assigneeId: "james",
    comments: 12,
  },
];

const initialActivity: ActivityItem[] = [
  {
    id: "activity-1",
    actor: "Sarah Chen",
    actorInitials: "SC",
    actorClass: "from-rose-400 to-pink-500",
    text: "commented on",
    target: "Logistics Optimization",
    timeAgo: "2m ago",
  },
  {
    id: "activity-2",
    actor: "James Wilson",
    actorInitials: "JW",
    actorClass: "from-slate-500 to-slate-700",
    text: "completed",
    target: "Weekly Audit",
    timeAgo: "15m ago",
  },
  {
    id: "activity-3",
    actor: "System AI",
    actorInitials: "AI",
    actorClass: "from-sky-500 to-blue-700",
    text: "generated new insight for",
    target: "Inventory Levels",
    timeAgo: "1h ago",
  },
  {
    id: "activity-4",
    actor: "Elena Rodriguez",
    actorInitials: "ER",
    actorClass: "from-amber-400 to-orange-500",
    text: "attached file to",
    target: "Team Onboarding",
    timeAgo: "3h ago",
  },
];

const columnMeta: Array<{ key: WorkspaceColumn; label: string }> = [
  { key: "todo", label: "To Do" },
  { key: "in-progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

function CollaborationIcon({
  kind,
}: {
  kind: "velocity" | "tasks" | "suggestions" | "sentiment" | "board" | "activity" | "send" | "lock";
}) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (kind === "velocity") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M4 16 9 11l3 3 8-8" />
        <path d="M15 6h5v5" />
      </svg>
    );
  }

  if (kind === "tasks") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </svg>
    );
  }

  if (kind === "suggestions") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
      </svg>
    );
  }

  if (kind === "sentiment") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M8.5 14.5c1 .9 2.2 1.5 3.5 1.5s2.5-.6 3.5-1.5" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
      </svg>
    );
  }

  if (kind === "board") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <rect x="4" y="5" width="6" height="14" rx="1.5" />
        <rect x="14" y="5" width="6" height="8" rx="1.5" />
        <path d="M14 17h6" />
      </svg>
    );
  }

  if (kind === "activity") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M4 12h4l2-5 4 10 2-5h4" />
      </svg>
    );
  }

  if (kind === "lock") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
      <path d="M5 12h10" />
      <path d="m11 6 6 6-6 6" />
    </svg>
  );
}

function priorityVariant(priority: Priority) {
  if (priority === "High") return "danger";
  if (priority === "Medium") return "warning";
  return "neutral";
}

function memberById(id: string) {
  return teamMembers.find((member) => member.id === id) ?? teamMembers[0];
}

export default function CollaborationPage() {
  const [activeTab, setActiveTab] = useState<"kanban" | "access">("kanban");
  const [taskFilter, setTaskFilter] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const filteredTasks = useMemo(() => {
    const query = taskFilter.trim().toLowerCase();
    if (!query) return tasks;

    return tasks.filter((task) => {
      const assignee = memberById(task.assigneeId);
      return `${task.title} ${task.description} ${assignee.name}`.toLowerCase().includes(query);
    });
  }, [taskFilter, tasks]);

  const summaryCards = useMemo(() => {
    const activeTasks = tasks.filter((task) => task.column !== "done").length;
    const aiSuggestions = 14;
    const highPriority = tasks.filter((task) => task.priority === "High").length;

    return [
      {
        label: "Team velocity",
        value: "94%",
        helper: "+12% from last week",
        icon: "velocity" as const,
        accentClass: "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
        iconClass: "bg-sky-100 text-sky-700",
      },
      {
        label: "Active tasks",
        value: String(activeTasks),
        helper: `${highPriority} high priority`,
        icon: "tasks" as const,
        accentClass: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
        iconClass: "bg-emerald-100 text-emerald-700",
      },
      {
        label: "AI suggestions",
        value: String(aiSuggestions),
        helper: "6 auto-resolved",
        icon: "suggestions" as const,
        accentClass: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
        iconClass: "bg-amber-100 text-amber-700",
      },
      {
        label: "Team sentiment",
        value: "Great",
        helper: "Based on last 50 comms",
        icon: "sentiment" as const,
        accentClass: "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
        iconClass: "bg-violet-100 text-violet-700",
      },
    ];
  }, [tasks]);

  const columns = columnMeta.map((column) => ({
    ...column,
    tasks: filteredTasks.filter((task) => task.column === column.key),
  }));

  const moveTaskForward = (taskId: string) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;
        if (task.column === "todo") return { ...task, column: "in-progress" };
        if (task.column === "in-progress") return { ...task, column: "done" };
        return task;
      }),
    );
    setToastMessage("Task updated.");
    setToastOpen(true);
  };

  const addPlaceholderTask = () => {
    const nextTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: "New follow-up task",
      description: "Placeholder task created for the collaboration workspace demo.",
      column: "todo",
      priority: "Low",
      assigneeId: "sarah",
      comments: 0,
    };
    setTasks((current) => [nextTask, ...current]);
    setToastMessage("Task added.");
    setToastOpen(true);
  };

  const broadcastToTeam = () => {
    const message = broadcastMessage.trim();
    if (!message) return;

    setActivity((current) => [
      {
        id: `activity-${Date.now()}`,
        actor: "Admin Workspace",
        actorInitials: "AP",
        actorClass: "from-sky-500 to-blue-700",
        text: "broadcasted",
        target: message,
        timeAgo: "now",
      },
      ...current,
    ]);
    setBroadcastMessage("");
    setToastMessage("Broadcast sent.");
    setToastOpen(true);
  };

  const topActions = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex -space-x-2">
        {teamMembers.slice(0, 4).map((member) => (
          <span
            key={member.id}
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br ${member.avatarClass} text-xs font-semibold text-white shadow-sm`}
          >
            {member.initials}
          </span>
        ))}
        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-white text-xs font-semibold text-gray-500 shadow-sm">
          +2
        </span>
      </div>

      <button
        className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
        onClick={() => {
          setToastMessage("Project workspace created.");
          setToastOpen(true);
        }}
        type="button"
      >
        <span className="text-base leading-none">+</span>
        New Project
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <PageHeader
        title="Collaboration Workspace"
        description="Coordinate your team, sync AI insights, and manage shared operations."
        actions={topActions}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`relative overflow-hidden border ${card.accentClass} p-0 shadow-sm`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-400" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className={`rounded-xl p-2.5 ${card.iconClass}`}>
                  <CollaborationIcon kind={card.icon} />
                </div>
                <Badge variant="neutral" className="bg-white/80 text-gray-600">
                  Live
                </Badge>
              </div>
              <p className="mt-5 text-sm font-medium text-gray-600">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">{card.helper}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-1">
                  <button
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      activeTab === "kanban" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                    }`}
                    onClick={() => setActiveTab("kanban")}
                    type="button"
                  >
                    Kanban Board
                  </button>
                  <button
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      activeTab === "access" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                    }`}
                    onClick={() => setActiveTab("access")}
                    type="button"
                  >
                    Access Controls
                  </button>
                </div>
              </div>

              {activeTab === "kanban" ? (
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-gray-400"
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
                    className="w-56 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                    onChange={(event) => setTaskFilter(event.target.value)}
                    placeholder="Filter tasks..."
                    type="text"
                    value={taskFilter}
                  />
                </div>
              ) : null}
            </div>
          </Card>

          {activeTab === "kanban" ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {columns.map((column) => (
                <div key={column.key} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{column.label}</p>
                      <p className="mt-1 text-xs text-gray-500">{column.tasks.length} tasks</p>
                    </div>
                    <button
                      className="rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                      onClick={() => {
                        setToastMessage(`${column.label} menu opened.`);
                        setToastOpen(true);
                      }}
                      type="button"
                    >
                      <span className="text-base leading-none">...</span>
                    </button>
                  </div>

                  {column.tasks.length > 0 ? (
                    column.tasks.map((task) => {
                      const assignee = memberById(task.assigneeId);
                      return (
                        <Card key={task.id} className="border-gray-200 bg-white shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                            <button
                              className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                              onClick={() => {
                                setToastMessage(`${task.title} options opened.`);
                                setToastOpen(true);
                              }}
                              type="button"
                            >
                              <span className="text-base leading-none">...</span>
                            </button>
                          </div>

                          <h3 className="mt-4 text-base font-semibold tracking-tight text-gray-950">{task.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-gray-600">{task.description}</p>

                          <div className="mt-5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${assignee.avatarClass} text-[0.68rem] font-semibold text-white`}
                              >
                                {assignee.initials}
                              </span>
                              <span className="text-sm text-gray-600">{assignee.name.split(" ")[0]}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{task.comments} comments</span>
                              {task.column !== "done" ? (
                                <button
                                  className="font-medium text-sky-700 transition hover:text-sky-800"
                                  onClick={() => moveTaskForward(task.id)}
                                  type="button"
                                >
                                  Move
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    <Card className="border-dashed border-gray-300 bg-gray-50 text-center shadow-sm">
                      <p className="text-sm font-medium text-gray-700">No tasks in this column</p>
                      <p className="mt-1 text-sm text-gray-500">Move work here or clear the current filter.</p>
                    </Card>
                  )}

                  {column.key === "todo" ? (
                    <button
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                      onClick={addPlaceholderTask}
                      type="button"
                    >
                      <span className="text-base leading-none">+</span>
                      Add task
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <span className="rounded-full bg-sky-100 p-2 text-sky-700">
                    <CollaborationIcon kind="lock" />
                  </span>
                  Workspace Access
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Shared permissions</h2>
                <div className="mt-5 space-y-3">
                  {[
                    ["Operations Leads", "Full edit access across logistics, inventory, and insights boards."],
                    ["Support Managers", "Comment and assign access for customer-service and chatbot workflows."],
                    ["Automation Admins", "Approve AI suggestions and publish collaboration updates."],
                  ].map(([title, copy]) => (
                    <div key={title} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-950">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{copy}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <span className="rounded-full bg-violet-100 p-2 text-violet-700">
                    <CollaborationIcon kind="board" />
                  </span>
                  Shared Spaces
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Team workspaces</h2>
                <div className="mt-5 space-y-3">
                  {[
                    ["Customer Support Command", "12 members", "Tracks escalations, AI review notes, and handoff quality."],
                    ["Operations Planning", "8 members", "Coordinates logistics, inventory shifts, and SLA recovery tasks."],
                    ["Leadership Reporting", "5 members", "Bundles weekly summaries, ROI snapshots, and AI recommendations."],
                  ].map(([title, members, copy]) => (
                    <div key={title} className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-950">{title}</p>
                        <Badge variant="neutral">{members}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{copy}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        <Card className="border-gray-200 bg-white p-0 shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="rounded-full bg-sky-100 p-2 text-sky-700">
                <CollaborationIcon kind="activity" />
              </span>
              Activity Stream
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">Live team updates</h2>
          </div>

          <div className="max-h-[540px] space-y-1 overflow-y-auto px-5 py-3">
            {activity.map((item) => (
              <div key={item.id} className="border-b border-gray-100 py-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.actorClass} text-xs font-semibold text-white`}
                  >
                    {item.actorInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-6 text-gray-700">
                      <span className="font-semibold text-gray-950">{item.actor}</span> {item.text}{" "}
                      <span className="font-medium text-sky-700">{item.target}</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{item.timeAgo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm">
              <input
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                onChange={(event) => setBroadcastMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    broadcastToTeam();
                  }
                }}
                placeholder="Broadcast to team..."
                type="text"
                value={broadcastMessage}
              />
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
                onClick={broadcastToTeam}
                type="button"
              >
                <CollaborationIcon kind="send" />
              </button>
            </div>
            <p className="mt-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Press enter to notify all
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
