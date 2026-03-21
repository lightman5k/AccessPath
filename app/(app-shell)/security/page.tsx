"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, PageHeader, Table, Toast } from "@/components/ui";

type ControlGroup = "privacy" | "governance";

type SecurityControl = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  group: ControlGroup;
};

type AuditStatus = "Success" | "Warning";
type AuditImpact = "Low" | "Medium" | "High" | "Critical";

type AuditLog = {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  status: AuditStatus;
  impact: AuditImpact;
};

const initialControls: SecurityControl[] = [
  {
    id: "aes256",
    title: "AES-256 Field Encryption",
    description: "Automatically encrypt sensitive PII at rest using military-grade AES-256 standards.",
    enabled: true,
    group: "privacy",
  },
  {
    id: "gdpr",
    title: "GDPR/CCPA Auto-Compliance",
    description: "Automatically handle Right to be Forgotten requests and generate processing agreements.",
    enabled: true,
    group: "privacy",
  },
  {
    id: "retention",
    title: "Data Retention Limit",
    description: "Permanently purge customer interaction data after 24 months of inactivity to minimize liability.",
    enabled: false,
    group: "privacy",
  },
  {
    id: "geo",
    title: "Geo-Fenced Data Hosting",
    description: "Restrict data storage to servers within the United States to comply with procurement rules.",
    enabled: true,
    group: "privacy",
  },
  {
    id: "training",
    title: "Model Training Opt-out",
    description: "Prevent business-specific data and customer interactions from being used to train global models.",
    enabled: true,
    group: "governance",
  },
  {
    id: "explainable",
    title: "Explainable AI Responses",
    description: "Force the AI to provide confidence scores and citations for every automated response.",
    enabled: true,
    group: "governance",
  },
  {
    id: "human-loop",
    title: "Human-in-the-loop",
    description: "Automatically flag and hold any AI action with a confidence score below 85% for manual review.",
    enabled: true,
    group: "governance",
  },
  {
    id: "guardrails",
    title: "Behavioral Guardrails",
    description: "Enable strict content filtering to prevent non-business topics or competitor references.",
    enabled: true,
    group: "governance",
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: "audit-1",
    action: "AI Model Re-training",
    actor: "System (Auto)",
    timestamp: "2026-03-20 14:20:01",
    status: "Success",
    impact: "Low",
  },
  {
    id: "audit-2",
    action: "Privacy Policy Update",
    actor: "Sarah Jenkins",
    timestamp: "2026-03-20 11:45:12",
    status: "Success",
    impact: "Critical",
  },
  {
    id: "audit-3",
    action: "Data Export Triggered",
    actor: "Marcus Thorne",
    timestamp: "2026-03-19 09:12:44",
    status: "Success",
    impact: "Medium",
  },
  {
    id: "audit-4",
    action: "Encryption Key Rotation",
    actor: "Security Bot",
    timestamp: "2026-03-19 00:00:01",
    status: "Success",
    impact: "High",
  },
  {
    id: "audit-5",
    action: "Failed Login Attempt",
    actor: "Unknown (IP: 192.168.1.1)",
    timestamp: "2026-03-18 22:15:30",
    status: "Warning",
    impact: "High",
  },
];

function SecurityIcon({
  kind,
}: {
  kind: "shield" | "privacy" | "governance" | "audit" | "search" | "export" | "scan";
}) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (kind === "shield") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
        <path d="M9.5 12.5l1.7 1.7 3.8-4.2" />
      </svg>
    );
  }

  if (kind === "privacy") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
      </svg>
    );
  }

  if (kind === "governance") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 3l8 4-8 4-8-4 8-4z" />
        <path d="M5 10v4c0 2 3.1 4 7 4s7-2 7-4v-4" />
      </svg>
    );
  }

  if (kind === "audit") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M8 7h8" />
        <path d="M8 11h8" />
        <path d="M8 15h5" />
        <path d="M6 3h9l3 3v15H6z" />
      </svg>
    );
  }

  if (kind === "search") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
    );
  }

  if (kind === "export") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" {...commonProps}>
      <path d="M4 12a8 8 0 1 0 8-8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function impactVariant(impact: AuditImpact) {
  if (impact === "Critical") return "danger";
  if (impact === "High") return "warning";
  if (impact === "Medium") return "info";
  return "neutral";
}

function statusVariant(status: AuditStatus) {
  return status === "Success" ? "success" : "warning";
}

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      aria-pressed={enabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        enabled ? "bg-blue-600" : "bg-gray-200"
      }`}
      onClick={onToggle}
      type="button"
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
          enabled ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SecurityPage() {
  const [controls, setControls] = useState<SecurityControl[]>(initialControls);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [scanRunning, setScanRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const privacyControls = controls.filter((control) => control.group === "privacy");
  const governanceControls = controls.filter((control) => control.group === "governance");
  const enabledCount = controls.filter((control) => control.enabled).length;
  const securityHealthScore = 86 + Math.round((enabledCount / controls.length) * 12);
  const activePrivacyShields = privacyControls.filter((control) => control.enabled).length;
  const openVulnerabilities = controls.some((control) => control.id === "human-loop" && !control.enabled) ? 1 : 0;

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return auditLogs;

    return auditLogs.filter((log) =>
      `${log.action} ${log.actor} ${log.status} ${log.impact}`.toLowerCase().includes(query),
    );
  }, [auditLogs, searchQuery]);

  const updateControl = (id: string) => {
    const control = controls.find((item) => item.id === id);
    if (!control) return;

    const nextEnabled = !control.enabled;
    setControls((current) =>
      current.map((item) => (item.id === id ? { ...item, enabled: nextEnabled } : item)),
    );
    setAuditLogs((current) => [
      {
        id: `audit-${Date.now()}`,
        action: `${control.title} ${nextEnabled ? "Enabled" : "Disabled"}`,
        actor: "Admin Workspace",
        timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
        status: "Success",
        impact: nextEnabled ? "Low" : "Medium",
      },
      ...current,
    ]);
    setToastMessage(`${control.title} ${nextEnabled ? "enabled" : "disabled"}.`);
    setToastOpen(true);
  };

  const runSecurityScan = () => {
    if (scanRunning) return;
    setScanRunning(true);

    window.setTimeout(() => {
      setAuditLogs((current) => [
        {
          id: `audit-scan-${Date.now()}`,
          action: "Security Scan Completed",
          actor: "Security Bot",
          timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
          status: "Success",
          impact: "Low",
        },
        ...current,
      ]);
      setScanRunning(false);
      setToastMessage("Security scan completed.");
      setToastOpen(true);
    }, 1400);
  };

  const exportAuditReport = () => {
    setToastMessage("Audit report exported.");
    setToastOpen(true);
  };

  const summaryCards = [
    {
      label: "Security Health Score",
      value: `${securityHealthScore}/100`,
      helper: "Last scanned 2 hours ago",
      badge: "Optimal",
      accentClass: "border-sky-200 bg-gradient-to-br from-sky-50 to-white",
    },
    {
      label: "Privacy Shields",
      value: `${activePrivacyShields} Active`,
      helper: "GDPR, CCPA, HIPAA, SOC 2",
      badge: "Active",
      accentClass: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    },
    {
      label: "Open Vulnerabilities",
      value: String(openVulnerabilities),
      helper: openVulnerabilities === 0 ? "AI systems patched" : "Human review required",
      badge: openVulnerabilities === 0 ? "Optimal" : "Review",
      accentClass: "border-violet-200 bg-gradient-to-br from-violet-50 to-white",
    },
  ];

  const tableRows = filteredLogs.map((log) => ({
    key: log.id,
    cells: [
      <span key={`${log.id}-action`} className="font-medium text-gray-900">
        {log.action}
      </span>,
      log.actor,
      log.timestamp,
      <Badge key={`${log.id}-status`} variant={statusVariant(log.status)}>
        {log.status}
      </Badge>,
      <Badge key={`${log.id}-impact`} variant={impactVariant(log.impact)}>
        {log.impact}
      </Badge>,
    ],
  }));

  return (
    <div className="space-y-8">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <PageHeader
        title="Security & Compliance"
        description="Manage your data protection settings, privacy standards, and AI transparency controls."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={exportAuditReport}
              type="button"
            >
              <SecurityIcon kind="export" />
              Export Audit Report
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={scanRunning}
              onClick={runSecurityScan}
              type="button"
            >
              <SecurityIcon kind="scan" />
              {scanRunning ? "Scanning..." : "Run Security Scan"}
            </button>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`relative overflow-hidden border ${card.accentClass} p-0 shadow-sm`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-400" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm ring-1 ring-gray-200">
                  <SecurityIcon kind="shield" />
                </span>
                <Badge variant="neutral">{card.badge}</Badge>
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-gray-950">{card.value}</p>
              <p className="mt-2 text-sm font-medium text-gray-700">{card.label}</p>
              <p className="mt-1 text-sm text-gray-500">{card.helper}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-gray-200 bg-white p-0 shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="rounded-full bg-sky-100 p-2 text-sky-700">
                <SecurityIcon kind="privacy" />
              </span>
              Data Protection & Privacy
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Configure how your customer data is stored, encrypted, and retained across the platform.
            </p>
          </div>
          <div>
            {privacyControls.map((control, index) => (
              <div
                key={control.id}
                className={`flex items-start justify-between gap-4 px-5 py-4 ${
                  index < privacyControls.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-950">{control.title}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{control.description}</p>
                </div>
                <Toggle enabled={control.enabled} onToggle={() => updateControl(control.id)} />
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500">
            Changes to privacy settings are logged and may take up to 24 hours to propagate across all nodes.
          </div>
        </Card>

        <Card className="border-gray-200 bg-white p-0 shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="rounded-full bg-violet-100 p-2 text-violet-700">
                <SecurityIcon kind="governance" />
              </span>
              AI Governance & Transparency
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Control AI model behaviors, data usage for training, and human intervention thresholds.
            </p>
          </div>
          <div>
            {governanceControls.map((control, index) => (
              <div
                key={control.id}
                className={`flex items-start justify-between gap-4 px-5 py-4 ${
                  index < governanceControls.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-950">{control.title}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{control.description}</p>
                </div>
                <Toggle enabled={control.enabled} onToggle={() => updateControl(control.id)} />
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-sky-700">
            View Model Transparency Report (Q2 2026)
          </div>
        </Card>
      </section>

      <Card className="border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <span className="rounded-full bg-blue-100 p-2 text-blue-700">
                <SecurityIcon kind="audit" />
              </span>
              Compliance Audit Logs
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              An immutable record of all security-critical actions performed by users and the AI system.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm">
              <span className="text-gray-400">
                <SecurityIcon kind="search" />
              </span>
              <input
                className="w-56 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search actions..."
                type="text"
                value={searchQuery}
              />
            </div>

            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => {
                setToastMessage("Audit filters opened.");
                setToastOpen(true);
              }}
              type="button"
            >
              <SecurityIcon kind="search" />
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50/50 p-1">
          <Table
            ariaLabel="Compliance audit logs"
            columns={[
              { key: "action", header: "Action" },
              { key: "actor", header: "Performed By" },
              { key: "timestamp", header: "Timestamp" },
              { key: "status", header: "Status", className: "w-28" },
              { key: "impact", header: "Impact", className: "w-28" },
            ]}
            rows={tableRows}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-gray-500">
          <p>Showing {filteredLogs.length} of 1,248 total log entries.</p>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-500" type="button">
              Previous
            </button>
            <button className="rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-gray-700" type="button">
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
