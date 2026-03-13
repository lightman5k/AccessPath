"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, PageHeader, Table, Toast } from "@/components/ui";
import { badgeMetaForAuditStatus, readStoredSettings, writeStoredSettings } from "@/lib";
import {
  defaultSettings,
  featureRequirements,
  hasFeatureAccess,
  saveMockSession,
  settingsAuditLog,
  useMockSession,
} from "@/lib/mock";
import type { SettingsState } from "@/types";

function ToggleRow({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-md border border-gray-200 bg-gray-50 p-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
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

export default function SettingsPage() {
  const session = useMockSession();
  const [settings, setSettings] = useState<SettingsState>(() => readStoredSettings() ?? defaultSettings);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const auditRows = useMemo(
    () =>
      settingsAuditLog.map((entry) => ({
        key: entry.id,
        cells: [
          entry.event,
          entry.actor,
          <Badge key={`${entry.id}-status`} variant={badgeMetaForAuditStatus(entry.status).variant}>
            {badgeMetaForAuditStatus(entry.status).label}
          </Badge>,
          entry.time,
        ],
      })),
    [],
  );

  const saveSettings = () => {
    writeStoredSettings(settings);
    setToastMessage("Settings saved.");
    setToastOpen(true);
  };

  if (!hasFeatureAccess(session, "settingsAccess")) {
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
                saveMockSession({ ...session, role: "admin" });
                setToastMessage("Mock role switched to admin.");
                setToastOpen(true);
              }}
              type="button"
            >
              Switch to Admin
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <PageHeader
        title="Settings"
        description="Manage profile details, workspace preferences, and account protections."
        actions={
          <button
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            onClick={saveSettings}
            type="button"
          >
            Save
          </button>
        }
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-gray-600" htmlFor="settings-full-name">
                Full Name
              </label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                id="settings-full-name"
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, fullName: event.target.value }))
                }
                type="text"
                value={settings.fullName}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600" htmlFor="settings-email">
                Email
              </label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                id="settings-email"
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, email: event.target.value }))
                }
                type="email"
                value={settings.email}
              />
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                id="settings-organization"
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    organizationName: event.target.value,
                  }))
                }
                type="text"
                value={settings.organizationName}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600" htmlFor="settings-team-size">
                Team Size
              </label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                id="settings-team-size"
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, teamSize: event.target.value }))
                }
                type="text"
                value={settings.teamSize}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Security</h2>
          <div className="mt-4 space-y-3">
            <ToggleRow
              checked={settings.twoFactorEnabled}
              description="Require two-factor authentication for all privileged actions."
              label="Two-Factor Authentication"
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, twoFactorEnabled: checked }))
              }
            />
            <ToggleRow
              checked={settings.sessionAlertsEnabled}
              description="Send alerts for logins from new devices or locations."
              label="Session Alerts"
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, sessionAlertsEnabled: checked }))
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
              label="Product Updates"
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, productUpdatesEnabled: checked }))
              }
            />
            <ToggleRow
              checked={settings.incidentAlertsEnabled}
              description="Send critical incident notifications to your primary email."
              label="Incident Alerts"
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, incidentAlertsEnabled: checked }))
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
    </div>
  );
}
