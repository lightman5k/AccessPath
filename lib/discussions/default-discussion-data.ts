import type { StoredDiscussionComment, StoredDiscussionThread } from "@/types";

export const defaultDiscussionThreads: StoredDiscussionThread[] = [
  {
    id: "delivery-playbook",
    title: "Should we standardize one delivery-delay playbook for support?",
    excerpt:
      "Shipping issues still create duplicate replies across support and logistics. We should align on one escalation path and one customer-facing response set.",
    body:
      "Shipping delays are still the largest source of repeated support effort. Right now the team is improvising updates per conversation, which makes the experience uneven and slows follow-up. I think we should define one shared playbook that covers ETA checks, compensation rules, and when a case should move into Collaboration for cross-team ownership.",
    tag: "Operations",
    authorName: "Sarah Chen",
    authorRole: "Operations Lead",
    authorInitials: "SC",
    authorAvatarClass: "from-rose-400 to-pink-500",
    createdAt: "2026-03-29T14:12:00.000Z",
    updatedAt: "2026-03-29T14:12:00.000Z",
    status: "active",
    pinned: true,
    locked: false,
    collaborationSuggested: true,
    baseVoteCount: 31,
  },
  {
    id: "csv-import-duplicates",
    title: "Imported support records look duplicated after the last CSV batch",
    excerpt:
      "The dashboard jumped after import and a few rows look repeated. I want to confirm whether this is a template problem or an import-validation gap.",
    body:
      "After importing the support sample plus a second operations export, the dashboard numbers looked inflated. I suspect a few rows were re-imported rather than merged. Before we tighten import rules, can we agree whether duplicates should be blocked, warned, or allowed with a source-level audit trail?",
    tag: "Integrations",
    authorName: "David Park",
    authorRole: "Integrations Manager",
    authorInitials: "DP",
    authorAvatarClass: "from-emerald-400 to-teal-600",
    createdAt: "2026-03-29T13:48:00.000Z",
    updatedAt: "2026-03-29T13:48:00.000Z",
    status: "needs-reply",
    pinned: false,
    locked: false,
    collaborationSuggested: true,
    baseVoteCount: 19,
  },
  {
    id: "security-checklist",
    title: "Should security review be required before adding a new external data source?",
    excerpt:
      "Manual data entry is live now, and external connectors are next. We should agree on the minimum checklist before new vendors touch the pipeline.",
    body:
      "As we add more data sources, it would help to define a lightweight review checklist before we connect them to the app. I am not suggesting a heavy process, but we should at least cover data access, retention, and who owns failure handling when a connector breaks.",
    tag: "Security",
    authorName: "James Wilson",
    authorRole: "Finance Ops",
    authorInitials: "JW",
    authorAvatarClass: "from-slate-500 to-slate-700",
    createdAt: "2026-03-29T10:45:00.000Z",
    updatedAt: "2026-03-29T10:45:00.000Z",
    status: "resolved",
    pinned: false,
    locked: false,
    collaborationSuggested: false,
    baseVoteCount: 16,
  },
];

export const defaultDiscussionComments: StoredDiscussionComment[] = [
  {
    id: "delivery-playbook-c1",
    threadId: "delivery-playbook",
    authorName: "David Park",
    authorRole: "Integrations Manager",
    authorInitials: "DP",
    authorAvatarClass: "from-emerald-400 to-teal-600",
    body:
      "Agree. We can route the high-priority ones into Collaboration automatically once the shipping sync is stale long enough.",
    createdAt: "2026-03-29T14:19:00.000Z",
  },
  {
    id: "delivery-playbook-c2",
    threadId: "delivery-playbook",
    authorName: "Elena Rodriguez",
    authorRole: "Customer Support",
    authorInitials: "ER",
    authorAvatarClass: "from-amber-400 to-orange-500",
    body:
      "A shared response tree would help a lot. The team is still rewriting the same answer depending on the carrier.",
    createdAt: "2026-03-29T14:23:00.000Z",
  },
  {
    id: "csv-import-duplicates-c1",
    threadId: "csv-import-duplicates",
    authorName: "James Wilson",
    authorRole: "Finance Ops",
    authorInitials: "JW",
    authorAvatarClass: "from-slate-500 to-slate-700",
    body:
      "If imports stay append-only, we should at least show a stronger duplicate warning before write.",
    createdAt: "2026-03-29T14:09:00.000Z",
  },
  {
    id: "security-checklist-c1",
    threadId: "security-checklist",
    authorName: "Sarah Chen",
    authorRole: "Operations Lead",
    authorInitials: "SC",
    authorAvatarClass: "from-rose-400 to-pink-500",
    body:
      "I would keep the checklist small, but yes, we need an owner and a rollback plan for every new connector.",
    createdAt: "2026-03-29T11:10:00.000Z",
  },
];
