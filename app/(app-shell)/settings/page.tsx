"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, PageHeader, Table, Toast } from "@/components/ui";
import { badgeMetaForAuditStatus } from "@/lib";
import { featureRequirements, hasFeatureAccess } from "@/lib/auth/feature-access";
import { useAuthSession } from "@/lib/auth/use-auth-session";
import type {
  SettingsApiResponse,
  SettingsAuditLogEntry,
  SettingsErrorResponse,
  SettingsField,
  SettingsState,
  UpdateSettingsRequest,
} from "@/types";

function formatAuditTime(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

function areSettingsEqual(left: SettingsState | null, right: SettingsState | null) {
  if (!left || !right) return false;

  return (
    left.fullName === right.fullName &&
    left.email === right.email &&
    left.organizationName === right.organizationName &&
    left.teamSize === right.teamSize &&
    left.twoFactorEnabled === right.twoFactorEnabled &&
    left.sessionAlertsEnabled === right.sessionAlertsEnabled &&
    left.productUpdatesEnabled === right.productUpdatesEnabled &&
    left.incidentAlertsEnabled === right.incidentAlertsEnabled
  );
}

function ToggleRow({
  checked,
  description,
  error,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  error?: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start justify-between gap-4 rounded-md border p-3 ${
        error ? "border-rose-300 bg-rose-50" : "border-gray-200 bg-gray-50"
      }`}
    >
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
      </div>
      <input
        checked={checked}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function FieldMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm text-rose-700">{message}</p>;
}

export default function SettingsPage() {
  const { loading: sessionLoading, refreshSession, session } = useAuthSession();
  const hasSettingsAccess = hasFeatureAccess(session, "settingsAccess");
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [savedSettings, setSavedSettings] = useState<SettingsState | null>(null);
  const [auditLog, setAuditLog] = useState<SettingsAuditLogEntry[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SettingsField, string>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  useEffect(() => {
    if (sessionLoading || !session.authenticated || !hasSettingsAccess) {
      return;
    }

    const controller = new AbortController();

    async function loadSettings() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = (await response.json()) as SettingsApiResponse | SettingsErrorResponse;
        if (!response.ok || !("settings" in payload)) {
          const message =
            "error" in payload ? payload.error : "Unable to load settings.";
          throw new Error(message);
        }

        if (controller.signal.aborted) return;

        setSettings(payload.settings);
        setSavedSettings(payload.settings);
        setAuditLog(payload.auditLog);
        setFieldErrors({});
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : "Unable to load settings.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => controller.abort();
  }, [hasSettingsAccess, retryKey, session.authenticated, session.user?.id, sessionLoading]);

  const auditRows = useMemo(
    () =>
      auditLog.map((entry) => ({
        key: entry.id,
        cells: [
          entry.event,
          entry.actor,
          <Badge key={`${entry.id}-status`} variant={badgeMetaForAuditStatus(entry.status).variant}>
            {badgeMetaForAuditStatus(entry.status).label}
          </Badge>,
          formatAuditTime(entry.time),
        ],
      })),
    [auditLog],
  );

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setFieldErrors({});

    try {
      const payload: UpdateSettingsRequest = settings;
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as SettingsApiResponse | SettingsErrorResponse;
      if (!response.ok || !("settings" in data)) {
        if ("fieldErrors" in data && data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        const message =
          "error" in data ? data.error : "Unable to save settings.";
        throw new Error(message);
      }

      setSettings(data.settings);
      setSavedSettings(data.settings);
      setAuditLog(data.auditLog);
      setToastMessage("Settings saved.");
      setToastOpen(true);
      setLoadError(null);
      await refreshSession();
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Unable to save settings.");
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  };

  if (!hasSettingsAccess) {
    return (
      <div className="space-y-6">
        <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />
        <PageHeader
          title="Settings"
          description="Manage profile details, workspace preferences, and account protections."
        />
        <Card>
          <div className="space-y-3">
            <EmptyState
              description={featureRequirements.settingsAccess.description}
              title="Settings access is locked"
            />
            <button
              className="rounded-md border border-indigo-300 px-3 py-2 text-sm text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
              onClick={() => {
                setToastMessage("Settings access is managed by your signed-in workspace role.");
                setToastOpen(true);
              }}
              type="button"
            >
              Admin role required
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const saveDisabled =
    sessionLoading || loading || saving || !settings || areSettingsEqual(settings, savedSettings);

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <PageHeader
        title="Settings"
        description="Manage profile details, workspace preferences, and account protections."
        actions={
          <button
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saveDisabled}
            onClick={saveSettings}
            type="button"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        }
      />

      {loadError ? (
        <Card className="border-rose-200 bg-rose-50 shadow-sm">
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-rose-900">Unable to load settings</h2>
              <p className="mt-1 text-sm text-rose-700">{loadError}</p>
            </div>
            <button
              className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2"
              onClick={() => setRetryKey((value) => value + 1)}
              type="button"
            >
              Retry
            </button>
          </div>
        </Card>
      ) : null}

      {!settings ? (
        <Card>
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center">
            <p className="text-sm font-medium text-gray-700">
              {loading || sessionLoading ? "Loading settings..." : "No settings available"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {loading || sessionLoading
                ? "We are loading your saved profile and preference settings."
                : "Settings will appear here once your account data is available."}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <h2 className="text-lg font-semibold">Profile</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-gray-600" htmlFor="settings-full-name">
                    Full Name
                  </label>
                  <input
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
                      fieldErrors.fullName ? "border-rose-300" : "border-gray-300"
                    }`}
                    id="settings-full-name"
                    onChange={(event) =>
                      setSettings((prev) => (prev ? { ...prev, fullName: event.target.value } : prev))
                    }
                    type="text"
                    value={settings.fullName}
                  />
                  <FieldMessage message={fieldErrors.fullName} />
                </div>
                <div>
                  <label className="text-sm text-gray-600" htmlFor="settings-email">
                    Email
                  </label>
                  <input
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
                      fieldErrors.email ? "border-rose-300" : "border-gray-300"
                    }`}
                    id="settings-email"
                    onChange={(event) =>
                      setSettings((prev) => (prev ? { ...prev, email: event.target.value } : prev))
                    }
                    type="email"
                    value={settings.email}
                  />
                  <FieldMessage message={fieldErrors.email} />
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Organization</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-gray-600" htmlFor="settings-organization">
                    Organization Name
                  </label>
                  <input
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
                      fieldErrors.organizationName ? "border-rose-300" : "border-gray-300"
                    }`}
                    id="settings-organization"
                    onChange={(event) =>
                      setSettings((prev) =>
                        prev ? { ...prev, organizationName: event.target.value } : prev,
                      )
                    }
                    type="text"
                    value={settings.organizationName}
                  />
                  <FieldMessage message={fieldErrors.organizationName} />
                </div>
                <div>
                  <label className="text-sm text-gray-600" htmlFor="settings-team-size">
                    Team Size
                  </label>
                  <input
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
                      fieldErrors.teamSize ? "border-rose-300" : "border-gray-300"
                    }`}
                    id="settings-team-size"
                    onChange={(event) =>
                      setSettings((prev) => (prev ? { ...prev, teamSize: event.target.value } : prev))
                    }
                    type="text"
                    value={settings.teamSize}
                  />
                  <FieldMessage message={fieldErrors.teamSize} />
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Security</h2>
              <div className="mt-4 space-y-3">
                <ToggleRow
                  checked={settings.twoFactorEnabled}
                  description="Save your two-factor preference now. Enforcement can be connected in a later security phase."
                  error={fieldErrors.twoFactorEnabled}
                  label="Two-Factor Authentication"
                  onChange={(checked) =>
                    setSettings((prev) => (prev ? { ...prev, twoFactorEnabled: checked } : prev))
                  }
                />
                <ToggleRow
                  checked={settings.sessionAlertsEnabled}
                  description="Send alerts for logins from new devices or locations."
                  error={fieldErrors.sessionAlertsEnabled}
                  label="Session Alerts"
                  onChange={(checked) =>
                    setSettings((prev) => (prev ? { ...prev, sessionAlertsEnabled: checked } : prev))
                  }
                />
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Notifications</h2>
              <div className="mt-4 space-y-3">
                <ToggleRow
                  checked={settings.productUpdatesEnabled}
                  description="Receive release updates, feature announcements, and roadmap notes."
                  error={fieldErrors.productUpdatesEnabled}
                  label="Product Updates"
                  onChange={(checked) =>
                    setSettings((prev) => (prev ? { ...prev, productUpdatesEnabled: checked } : prev))
                  }
                />
                <ToggleRow
                  checked={settings.incidentAlertsEnabled}
                  description="Send critical incident notifications to your primary email."
                  error={fieldErrors.incidentAlertsEnabled}
                  label="Incident Alerts"
                  onChange={(checked) =>
                    setSettings((prev) => (prev ? { ...prev, incidentAlertsEnabled: checked } : prev))
                  }
                />
              </div>
            </Card>
          </section>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Audit Log</h2>
              <p className="text-sm text-gray-500">{auditRows.length} events</p>
            </div>

            {auditRows.length > 0 ? (
              <Table
                ariaLabel="Settings audit log"
                columns={[
                  { key: "event", header: "Event" },
                  { key: "actor", header: "Actor" },
                  { key: "status", header: "Status" },
                  { key: "time", header: "Time" },
                ]}
                rows={auditRows}
              />
            ) : (
              <EmptyState
                description="Audit activity will appear here when settings or access events are recorded."
                title="No audit log entries"
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
