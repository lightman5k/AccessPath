"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, Modal, PageHeader, Toast } from "@/components/ui";
import { featureRequirements, hasFeatureAccess } from "@/lib/auth/feature-access";
import { useAuthSession } from "@/lib/auth/use-auth-session";
import { demoDataResetEvent } from "@/lib/mock";
import type {
  CreateSupportRecordRequest,
  ImportSupportRecordsRequest,
  IntegrationApiItem,
  IntegrationErrorResponse,
  IntegrationId,
  IntegrationsApiResponse,
  SupportRecordErrorResponse,
  SupportRecordImportResponse,
  SupportRecordImportRowError,
  SupportRecordInput,
  UpdateIntegrationRequest,
} from "@/types";
import { badgeMetaForIntegrationStatus } from "@/lib";

type ManualEntryMode = "record" | "csv";

type SupportRecordFormState = {
  sourceName: string;
  occurredAt: string;
  customer: string;
  channel: SupportRecordInput["channel"];
  category: SupportRecordInput["category"];
  subject: string;
  status: SupportRecordInput["status"];
  priority: SupportRecordInput["priority"];
  responseMinutes: string;
  notes: string;
};

type CsvImportFormState = {
  sourceName: string;
  csvText: string;
  fileName: string;
};

const csvRequiredColumns = [
  "occurredAt",
  "customer",
  "channel",
  "category",
  "subject",
  "status",
  "priority",
  "responseMinutes",
  "notes",
] as const;

const csvAllowedValues = {
  channel: ["Web Chat", "Email", "SMS"],
  category: ["Delivery", "Returns", "Billing", "Account"],
  status: ["Open", "In Progress", "Resolved", "Escalated"],
  priority: ["High", "Medium", "Low"],
} as const;

function formatLastSync(value?: string): string {
  if (!value) return "Never";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "Never";
  return new Date(parsed).toLocaleString();
}

function toDateTimeLocalValue(value?: string) {
  if (!value) {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 16);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const offset = parsed.getTimezoneOffset();
  const local = new Date(parsed.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function buildDefaultRecordForm(sourceName = ""): SupportRecordFormState {
  return {
    sourceName,
    occurredAt: toDateTimeLocalValue(),
    customer: "",
    channel: "Web Chat",
    category: "Delivery",
    subject: "",
    status: "Open",
    priority: "Medium",
    responseMinutes: "",
    notes: "",
  };
}

function buildDefaultCsvForm(sourceName = ""): CsvImportFormState {
  return {
    sourceName,
    csvText: "",
    fileName: "",
  };
}

function buildCsvTemplate() {
  return [
    "occurredAt,customer,channel,category,subject,status,priority,responseMinutes,notes",
    '2026-03-28T09:30,Jane Doe,Web Chat,Delivery,"Package still not delivered",Open,High,18.5,"Customer asked for updated ETA"',
  ].join("\n");
}

function downloadCsvTemplate() {
  const blob = new Blob([buildCsvTemplate()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "support-record-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error("The server returned an empty response.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

function ConnectorIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M8 12h8" />
      <path d="M12 8v8" />
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="9" y="14" width="6" height="6" rx="1.5" />
    </svg>
  );
}

export default function IntegrationsPage() {
  const { session } = useAuthSession();
  const [integrations, setIntegrations] = useState<IntegrationApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [pendingIntegrationId, setPendingIntegrationId] = useState<IntegrationId | null>(null);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [salesforceLockedOpen, setSalesforceLockedOpen] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualMode, setManualMode] = useState<ManualEntryMode>("record");
  const [recordForm, setRecordForm] = useState<SupportRecordFormState>(buildDefaultRecordForm);
  const [csvForm, setCsvForm] = useState<CsvImportFormState>(buildDefaultCsvForm);
  const [recordFieldErrors, setRecordFieldErrors] = useState<
    Partial<Record<keyof SupportRecordInput, string>>
  >({});
  const [csvFieldErrors, setCsvFieldErrors] = useState<
    Partial<Record<"sourceName" | "csvText", string>>
  >({});
  const [csvRowErrors, setCsvRowErrors] = useState<SupportRecordImportRowError[]>(
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadIntegrations() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/integrations", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}.`);
        }

        const payload = await readJsonResponse<IntegrationsApiResponse>(response);
        setIntegrations(payload.items);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load integration status.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadIntegrations();

    return () => controller.abort();
  }, [retryKey]);

  useEffect(() => {
    const handleDemoReset = () => setRetryKey((value) => value + 1);
    window.addEventListener(demoDataResetEvent, handleDemoReset);
    return () => window.removeEventListener(demoDataResetEvent, handleDemoReset);
  }, []);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const connectedCount = useMemo(
    () => integrations.filter((item) => item.status === "connected").length,
    [integrations],
  );

  const manualEntryItem = useMemo(
    () => integrations.find((item) => item.id === "manual-entry") ?? null,
    [integrations],
  );
  const csvPreviewLines = useMemo(
    () =>
      csvForm.csvText
        .replace(/\r\n/g, "\n")
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, 3),
    [csvForm.csvText],
  );

  async function applyIntegrationUpdate(
    requestBody: UpdateIntegrationRequest,
  ): Promise<IntegrationsApiResponse> {
    setPendingIntegrationId(requestBody.integrationId);

    try {
      const response = await fetch("/api/integrations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const payload = await readJsonResponse<IntegrationsApiResponse | IntegrationErrorResponse>(response);

      if (!response.ok) {
        throw payload;
      }

      const successPayload = payload as IntegrationsApiResponse;
      setIntegrations(successPayload.items);
      return successPayload;
    } finally {
      setPendingIntegrationId(null);
    }
  }

  async function connectIntegration(item: IntegrationApiItem) {
    try {
      await applyIntegrationUpdate({
        integrationId: item.id,
        action: "connect",
      });
      setToastMessage(`${item.name} connected.`);
    } catch (updateError) {
      const message =
        typeof updateError === "object" &&
        updateError !== null &&
        "error" in updateError &&
        typeof updateError.error === "string"
          ? updateError.error
          : `Unable to connect ${item.name}.`;
      setToastMessage(message);
    }

    setToastOpen(true);
  }

  async function disconnectIntegration(item: IntegrationApiItem) {
    try {
      await applyIntegrationUpdate({
        integrationId: item.id,
        action: "disconnect",
      });
      setToastMessage(`${item.name} disconnected.`);
    } catch (updateError) {
      const message =
        typeof updateError === "object" &&
        updateError !== null &&
        "error" in updateError &&
        typeof updateError.error === "string"
          ? updateError.error
          : `Unable to disconnect ${item.name}.`;
      setToastMessage(message);
    }

    setToastOpen(true);
  }

  async function testConnection(item: IntegrationApiItem) {
    try {
      await applyIntegrationUpdate({
        integrationId: item.id,
        action: "test",
      });
      setToastMessage(`Test passed: ${item.name} is reachable.`);
    } catch (updateError) {
      const message =
        typeof updateError === "object" &&
        updateError !== null &&
        "error" in updateError &&
        typeof updateError.error === "string"
          ? updateError.error
          : `Unable to test ${item.name}.`;
      setToastMessage(message);
    }

    setToastOpen(true);
  }

  function resetManualState(nextMode: ManualEntryMode) {
    const suggestedSourceName = manualEntryItem?.manualSummary?.sourceName ?? "";
    setManualMode(nextMode);
    setRecordFieldErrors({});
    setCsvFieldErrors({});
    setCsvRowErrors([]);
    setRecordForm(buildDefaultRecordForm(suggestedSourceName));
    setCsvForm(buildDefaultCsvForm(suggestedSourceName));
  }

  function openManualEntryModal(nextMode: ManualEntryMode) {
    resetManualState(nextMode);
    setManualEntryOpen(true);
  }

  async function submitSupportRecord() {
    setManualSubmitting(true);
    setRecordFieldErrors({});

    try {
      const payload: CreateSupportRecordRequest = {
        sourceName: recordForm.sourceName,
        occurredAt: recordForm.occurredAt,
        customer: recordForm.customer,
        channel: recordForm.channel,
        category: recordForm.category,
        subject: recordForm.subject,
        status: recordForm.status,
        priority: recordForm.priority,
        responseMinutes: Number(recordForm.responseMinutes),
        notes: recordForm.notes,
      };

      const response = await fetch("/api/support-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await readJsonResponse<IntegrationsApiResponse | SupportRecordErrorResponse>(response);

      if (!response.ok) {
        throw data;
      }

      setManualEntryOpen(false);
      setRetryKey((current) => current + 1);
      setToastMessage("Support record saved.");
      setToastOpen(true);
    } catch (submitError) {
      if (
        typeof submitError === "object" &&
        submitError !== null &&
        "fieldErrors" in submitError &&
        submitError.fieldErrors &&
        typeof submitError.fieldErrors === "object"
      ) {
        setRecordFieldErrors(
          submitError.fieldErrors as Partial<Record<keyof SupportRecordInput, string>>,
        );
      }

      const message =
        typeof submitError === "object" &&
        submitError !== null &&
        "error" in submitError &&
        typeof submitError.error === "string"
          ? submitError.error
          : submitError instanceof Error
            ? submitError.message
            : "Unable to save the support record.";
      setToastMessage(message);
      setToastOpen(true);
    } finally {
      setManualSubmitting(false);
    }
  }

  async function submitCsvImport() {
    setManualSubmitting(true);
    setCsvFieldErrors({});
    setCsvRowErrors([]);

    try {
      const payload: ImportSupportRecordsRequest = {
        sourceName: csvForm.sourceName,
        csvText: csvForm.csvText,
      };

      const response = await fetch("/api/support-records/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await readJsonResponse<
        | SupportRecordImportResponse
        | SupportRecordErrorResponse
      >(response);

      if (!response.ok) {
        throw data;
      }

      const successData = data as SupportRecordImportResponse;
      setManualEntryOpen(false);
      setRetryKey((current) => current + 1);
      setToastMessage(
        `${successData.importedCount} support record${successData.importedCount === 1 ? "" : "s"} imported.`,
      );
      setToastOpen(true);
    } catch (submitError) {
      if (
        typeof submitError === "object" &&
        submitError !== null &&
        "fieldErrors" in submitError &&
        submitError.fieldErrors &&
        typeof submitError.fieldErrors === "object"
      ) {
        setCsvFieldErrors(
          submitError.fieldErrors as Partial<Record<"sourceName" | "csvText", string>>,
        );
      }

      if (
        typeof submitError === "object" &&
        submitError !== null &&
        "rowErrors" in submitError &&
        Array.isArray(submitError.rowErrors)
      ) {
        setCsvRowErrors(submitError.rowErrors as SupportRecordImportRowError[]);
      }

      const message =
        typeof submitError === "object" &&
        submitError !== null &&
        "error" in submitError &&
        typeof submitError.error === "string"
          ? submitError.error
          : submitError instanceof Error
            ? submitError.message
            : "Unable to import the CSV file.";
      setToastMessage(message);
      setToastOpen(true);
    } finally {
      setManualSubmitting(false);
    }
  }

  async function handleCsvFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCsvForm((current) => ({
      ...current,
      csvText: text,
      fileName: file.name,
    }));
    setCsvFieldErrors((current) => ({ ...current, csvText: undefined }));
    setCsvRowErrors([]);
  }

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <PageHeader
        title="AccessPath Integrations"
        description="Manage connectors, capture support records one by one, or import CSV batches into the shared analytics pipeline."
        actions={
          <Badge className="px-3 py-1" variant="info">
            {connectedCount} connected
          </Badge>
        }
      />

      {error && integrations.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-amber-800">{error}</p>
            <button
              className="rounded-md border border-amber-300 px-3 py-2 text-sm text-amber-800 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2"
              onClick={() => setRetryKey((value) => value + 1)}
              type="button"
            >
              Retry
            </button>
          </div>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {loading && integrations.length === 0 ? (
          <div className="md:col-span-2">
            <Card className="border-gray-200 bg-white shadow-sm">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-8 w-56 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-4 w-5/6 rounded bg-gray-100" />
                <div className="mt-4 h-16 rounded-xl bg-gray-100" />
              </div>
            </Card>
          </div>
        ) : error && integrations.length === 0 ? (
          <div className="md:col-span-2">
            <Card className="border-red-200 bg-red-50 shadow-sm">
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-red-900">
                    Unable to load integrations
                  </h2>
                  <p className="mt-1 text-sm text-red-700">
                    The integrations API did not return data for this demo view.
                  </p>
                </div>
                <button
                  className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
                  onClick={() => setRetryKey((value) => value + 1)}
                  type="button"
                >
                  Retry
                </button>
              </div>
            </Card>
          </div>
        ) : integrations.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState
              title="No integrations available"
              description="Add connectors to the integration catalog to manage them here."
            />
          </div>
        ) : (
          integrations.map((item) => {
            const meta = badgeMetaForIntegrationStatus(item.status);
            const isConnected = item.status === "connected";
            const isManualEntry = item.id === "manual-entry";
            const isPending = pendingIntegrationId === item.id;
            const salesforceLocked =
              item.id === "salesforce" &&
              !hasFeatureAccess(session, "salesforceIntegration");

            return (
              <Card key={item.id} className="border-gray-200 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <span className="rounded-full bg-sky-100 p-2 text-sky-700">
                        <ConnectorIcon />
                      </span>
                      {item.category} via {item.provider}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">
                      {item.name}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>

                <dl className="mt-5 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500">Last sync</dt>
                    <dd className="font-medium text-gray-900">{formatLastSync(item.lastSyncAt)}</dd>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <dt className="text-gray-500">Sync state</dt>
                    <dd className="font-medium capitalize text-gray-900">{item.syncState}</dd>
                  </div>
                </dl>

                {isManualEntry ? (
                  item.manualSummary ? (
                    <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-sky-950">Current manual source summary</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
                          {item.manualSummary.latestInputMethod === "csv" ? "CSV import" : "Form entry"}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-sky-700">Source</p>
                          <p className="mt-1 text-gray-900">{item.manualSummary.sourceName}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-sky-700">Total Records</p>
                          <p className="mt-1 text-gray-900">{item.manualSummary.totalRecords}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-sky-700">Latest Customer</p>
                          <p className="mt-1 text-gray-900">{item.manualSummary.latestCustomer}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-sky-700">Latest Batch</p>
                          <p className="mt-1 text-gray-900">{item.manualSummary.latestBatchCount} records</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-sky-700">Latest Category</p>
                          <p className="mt-1 text-gray-900">{item.manualSummary.latestCategory}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-sky-700">Latest Status</p>
                          <p className="mt-1 text-gray-900">{item.manualSummary.latestStatus}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                      No support records have been added yet. Start with one record or import a CSV batch.
                    </div>
                  )
                ) : null}

                {salesforceLocked ? (
                  <p className="mt-3 text-sm text-amber-700">
                    {featureRequirements.salesforceIntegration.description}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {isManualEntry ? (
                    <>
                      <button
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                        onClick={() => openManualEntryModal("record")}
                        type="button"
                      >
                        Enter Record
                      </button>
                      <button
                        className="rounded-md border border-sky-300 px-3 py-2 text-sm text-sky-700 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                        onClick={() => openManualEntryModal("csv")}
                        type="button"
                      >
                        Import CSV
                      </button>
                    </>
                  ) : salesforceLocked ? (
                    <button
                      className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                      onClick={() => setSalesforceLockedOpen(true)}
                      type="button"
                    >
                      Upgrade for Salesforce
                    </button>
                  ) : isConnected ? (
                    <button
                      className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-red-200 disabled:text-red-300 disabled:hover:bg-white"
                      disabled={isPending}
                      onClick={() => disconnectIntegration(item)}
                      type="button"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white"
                      disabled={isPending}
                      onClick={() => connectIntegration(item)}
                      type="button"
                    >
                      Connect
                    </button>
                  )}

                  {!isManualEntry ? (
                    <button
                      className="rounded-md border border-blue-300 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white"
                      disabled={item.status === "syncing" || salesforceLocked || isPending}
                      onClick={() => {
                        if (salesforceLocked) {
                          setSalesforceLockedOpen(true);
                          return;
                        }
                        void testConnection(item);
                      }}
                      type="button"
                    >
                      Test Connection
                    </button>
                  ) : (
                    <p className="self-center text-xs text-gray-500">
                      Imported support records power the dashboard, analytics, and insight pages.
                    </p>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </section>

      <Modal
        footer={
          <>
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => setManualEntryOpen(false)}
              type="button"
            >
              Cancel
            </button>
            {manualMode === "record" ? (
              <button
                className="rounded-md border border-sky-300 px-3 py-2 text-sm text-sky-700 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-sky-200 disabled:text-sky-300 disabled:hover:bg-white"
                disabled={manualSubmitting}
                onClick={() => void submitSupportRecord()}
                type="button"
              >
                Save Record
              </button>
            ) : (
              <button
                className="rounded-md border border-sky-300 px-3 py-2 text-sm text-sky-700 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-sky-200 disabled:text-sky-300 disabled:hover:bg-white"
                disabled={manualSubmitting}
                onClick={() => void submitCsvImport()}
                type="button"
              >
                Import Records
              </button>
            )}
          </>
        }
        onClose={() => setManualEntryOpen(false)}
        open={manualEntryOpen}
        size="lg"
        title={manualMode === "record" ? "Manual Support Record" : "Import Support Records"}
      >
        <div className="min-w-0 space-y-4">
          <div className="flex gap-2">
            <button
              className={`rounded-md border px-3 py-2 text-sm transition ${
                manualMode === "record"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => resetManualState("record")}
              type="button"
            >
              Single Record
            </button>
            <button
              className={`rounded-md border px-3 py-2 text-sm transition ${
                manualMode === "csv"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => resetManualState("csv")}
              type="button"
            >
              CSV Batch
            </button>
          </div>

          {manualMode === "record" ? (
            <div key="manual-record-mode" className="space-y-4">
              <p className="text-sm text-gray-600">
                Add one support interaction at a time. These records become the source of truth for your dashboard and analytics.
              </p>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="record-source-name">
                  Source Name
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                  id="record-source-name"
                  onChange={(event) =>
                    setRecordForm((current) => ({ ...current, sourceName: event.target.value }))
                  }
                  type="text"
                  value={recordForm.sourceName}
                />
                {recordFieldErrors.sourceName ? (
                  <p className="mt-1 text-xs text-red-600">{recordFieldErrors.sourceName}</p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="record-occurred-at">
                  Occurred At
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                  id="record-occurred-at"
                  onChange={(event) =>
                    setRecordForm((current) => ({ ...current, occurredAt: event.target.value }))
                  }
                  type="datetime-local"
                  value={recordForm.occurredAt}
                />
                {recordFieldErrors.occurredAt ? (
                  <p className="mt-1 text-xs text-red-600">{recordFieldErrors.occurredAt}</p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="record-customer">
                  Customer
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                  id="record-customer"
                  onChange={(event) =>
                    setRecordForm((current) => ({ ...current, customer: event.target.value }))
                  }
                  type="text"
                  value={recordForm.customer}
                />
                {recordFieldErrors.customer ? (
                  <p className="mt-1 text-xs text-red-600">{recordFieldErrors.customer}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="record-channel">
                    Channel
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                    id="record-channel"
                    onChange={(event) =>
                      setRecordForm((current) => ({
                        ...current,
                        channel: event.target.value as SupportRecordInput["channel"],
                      }))
                    }
                    value={recordForm.channel}
                  >
                    <option value="Web Chat">Web Chat</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="record-category">
                    Category
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                    id="record-category"
                    onChange={(event) =>
                      setRecordForm((current) => ({
                        ...current,
                        category: event.target.value as SupportRecordInput["category"],
                      }))
                    }
                    value={recordForm.category}
                  >
                    <option value="Delivery">Delivery</option>
                    <option value="Returns">Returns</option>
                    <option value="Billing">Billing</option>
                    <option value="Account">Account</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="record-status">
                    Status
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                    id="record-status"
                    onChange={(event) =>
                      setRecordForm((current) => ({
                        ...current,
                        status: event.target.value as SupportRecordInput["status"],
                      }))
                    }
                    value={recordForm.status}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="record-priority">
                    Priority
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                    id="record-priority"
                    onChange={(event) =>
                      setRecordForm((current) => ({
                        ...current,
                        priority: event.target.value as SupportRecordInput["priority"],
                      }))
                    }
                    value={recordForm.priority}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="record-subject">
                  Issue Summary
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                  id="record-subject"
                  onChange={(event) =>
                    setRecordForm((current) => ({ ...current, subject: event.target.value }))
                  }
                  type="text"
                  value={recordForm.subject}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="record-response">
                  Response Minutes
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                  id="record-response"
                  min="0"
                  onChange={(event) =>
                    setRecordForm((current) => ({
                      ...current,
                      responseMinutes: event.target.value,
                    }))
                  }
                  step="0.1"
                  type="number"
                  value={recordForm.responseMinutes}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="record-notes">
                  Notes
                </label>
                <textarea
                  className="mt-1 min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                  id="record-notes"
                  onChange={(event) =>
                    setRecordForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  value={recordForm.notes}
                />
              </div>
            </div>
          ) : (
            <div key="manual-csv-mode" className="space-y-4">
              <p className="text-sm text-gray-600">
                Import support records in bulk with the app template. The CSV is validated before any records are written.
              </p>

              <div className="min-w-0 rounded-xl border border-sky-200 bg-sky-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-sky-950">CSV Template Guide</p>
                    <p className="mt-1 text-xs leading-5 text-sky-900">
                      Use one header row, keep the column names exactly as shown, and quote any subject or notes fields that contain commas.
                    </p>
                  </div>
                  <button
                    className="rounded-md border border-sky-300 bg-white px-3 py-2 text-sm text-sky-700 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                    onClick={downloadCsvTemplate}
                    type="button"
                  >
                    Download Template
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                      Required Columns
                    </p>
                    <p className="mt-2 text-sm leading-6 text-sky-950">
                      {csvRequiredColumns.join(", ")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <div className="min-w-0 rounded-lg border border-sky-100 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                        Allowed Values
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-sky-950">
                        <p>Channel: {csvAllowedValues.channel.join(", ")}</p>
                        <p>Category: {csvAllowedValues.category.join(", ")}</p>
                        <p>Status: {csvAllowedValues.status.join(", ")}</p>
                        <p>Priority: {csvAllowedValues.priority.join(", ")}</p>
                      </div>
                    </div>

                    <div className="min-w-0 rounded-lg border border-sky-100 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                        Format Notes
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-sky-950">
                        <p>`occurredAt` accepts `YYYY-MM-DDTHH:mm` or a full ISO timestamp.</p>
                        <p>`responseMinutes` must be a number like `18.5` or `0`.</p>
                        <p>Every row is validated before anything is imported.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                      Sample CSV
                    </p>
                    <pre className="mt-2 max-w-full overflow-x-auto rounded-lg border border-sky-100 bg-slate-950 p-3 text-xs leading-6 text-sky-100">
                      <code>{buildCsvTemplate()}</code>
                    </pre>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="csv-source-name">
                  Source Name
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
                  id="csv-source-name"
                  onChange={(event) =>
                    setCsvForm((current) => ({ ...current, sourceName: event.target.value }))
                  }
                  type="text"
                  value={csvForm.sourceName}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="csv-file">
                  CSV File
                </label>
                <input
                  accept=".csv,text/csv"
                  className="mt-1 block w-full text-sm text-gray-700"
                  id="csv-file"
                  onChange={(event) => void handleCsvFileChange(event)}
                  type="file"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {csvForm.fileName ? `Loaded ${csvForm.fileName}` : "Choose a .csv file that matches the template."}
                </p>
                {csvFieldErrors.csvText ? (
                  <p className="mt-1 text-xs text-red-600">{csvFieldErrors.csvText}</p>
                ) : null}
              </div>

              {csvPreviewLines.length > 0 ? (
                <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Loaded Preview
                  </p>
                  <pre className="mt-2 max-w-full overflow-x-auto text-xs leading-6 text-gray-700">
                    <code>{csvPreviewLines.join("\n")}</code>
                  </pre>
                </div>
              ) : null}

              {csvRowErrors.length > 0 ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-900">CSV validation errors</p>
                  <ul className="mt-2 space-y-1 text-sm text-red-700">
                    {csvRowErrors.slice(0, 5).map((rowError) => (
                      <li key={`${rowError.rowNumber}-${rowError.message}`}>
                        Row {rowError.rowNumber}: {rowError.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        footer={
          <>
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              onClick={() => setSalesforceLockedOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-md border border-indigo-300 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
              onClick={() => {
                setSalesforceLockedOpen(false);
                setToastMessage("Salesforce access is managed by your signed-in workspace plan.");
                setToastOpen(true);
              }}
              type="button"
            >
              Understood
            </button>
          </>
        }
        onClose={() => setSalesforceLockedOpen(false)}
        open={salesforceLockedOpen}
        title="Salesforce Requires Pro"
      >
        <p className="text-sm text-gray-700">
          {featureRequirements.salesforceIntegration.description}
        </p>
      </Modal>
    </div>
  );
}
