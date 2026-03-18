"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, Modal, PageHeader, Toast } from "@/components/ui";
import {
  badgeMetaForIntegrationStatus,
  defaultStoredIntegrations,
  readStoredIntegrations,
  writeStoredIntegrations,
} from "@/lib";
import {
  demoDataResetEvent,
  featureRequirements,
  hasFeatureAccess,
  saveMockSession,
  useMockSession,
} from "@/lib/mock";
import type { IntegrationId, IntegrationItem } from "@/types";

function formatLastSync(value?: string): string {
  if (!value) return "Never";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "Never";
  return new Date(parsed).toLocaleString();
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
  const session = useMockSession();
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(() => defaultStoredIntegrations());
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [salesforceLockedOpen, setSalesforceLockedOpen] = useState(false);

  useEffect(() => {
    const hydrateIntegrations = () => {
      const stored = readStoredIntegrations();
      setIntegrations(stored ?? defaultStoredIntegrations());
    };

    hydrateIntegrations();
    window.addEventListener(demoDataResetEvent, hydrateIntegrations);
    return () => window.removeEventListener(demoDataResetEvent, hydrateIntegrations);
  }, []);

  useEffect(() => {
    writeStoredIntegrations(integrations);
  }, [integrations]);

  useEffect(() => {
    if (!toastOpen) return;
    const timeout = window.setTimeout(() => setToastOpen(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [toastOpen]);

  const connectedCount = useMemo(
    () => integrations.filter((item) => item.status === "connected").length,
    [integrations],
  );

  const updateIntegration = (id: IntegrationId, updater: (item: IntegrationItem) => IntegrationItem) => {
    setIntegrations((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  };

  const connectIntegration = (id: IntegrationId) => {
    updateIntegration(id, (item) => ({ ...item, status: "syncing" }));

    window.setTimeout(() => {
      updateIntegration(id, (item) => ({
        ...item,
        status: "connected",
        lastSyncAt: new Date().toISOString(),
      }));
      const integration = integrations.find((item) => item.id === id);
      setToastMessage(`${integration?.name ?? "Integration"} connected.`);
      setToastOpen(true);
    }, 1200);
  };

  const disconnectIntegration = (id: IntegrationId) => {
    updateIntegration(id, (item) => ({ ...item, status: "not-connected" }));
    const integration = integrations.find((item) => item.id === id);
    setToastMessage(`${integration?.name ?? "Integration"} disconnected.`);
    setToastOpen(true);
  };

  const testConnection = (id: IntegrationId) => {
    updateIntegration(id, (item) => ({ ...item, status: "syncing" }));

    window.setTimeout(() => {
      const passed = Math.random() > 0.2;
      const integration = integrations.find((item) => item.id === id);

      if (passed) {
        updateIntegration(id, (item) => ({
          ...item,
          status: "connected",
          lastSyncAt: new Date().toISOString(),
        }));
        setToastMessage(`Test passed: ${integration?.name ?? "Integration"} is reachable.`);
      } else {
        updateIntegration(id, (item) => ({ ...item, status: "error" }));
        setToastMessage(`Test failed: ${integration?.name ?? "Integration"} connection error.`);
      }

      setToastOpen(true);
    }, 700);
  };

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} onClose={() => setToastOpen(false)} open={toastOpen} />

      <PageHeader
        title="AccessPath Integrations"
        description="Manage connector status, test connections, and monitor sync health."
        actions={<Badge variant="info" className="px-3 py-1">{connectedCount} connected</Badge>}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {integrations.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState
              title="No integrations available"
              description="Add connectors to the integration catalog to manage them here."
            />
          </div>
        ) : integrations.map((item) => {
          const meta = badgeMetaForIntegrationStatus(item.status);
          const isConnected = item.status === "connected";
          const salesforceLocked =
            item.id === "salesforce" && !hasFeatureAccess(session, "salesforceIntegration");

          return (
            <Card key={item.id} className="border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <span className="rounded-full bg-sky-100 p-2 text-sky-700">
                      <ConnectorIcon />
                    </span>
                    Connector
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">{item.name}</h2>
                  <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                </div>
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>

              <dl className="mt-5 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Last sync</dt>
                  <dd className="font-medium text-gray-900">{formatLastSync(item.lastSyncAt)}</dd>
                </div>
              </dl>
              {salesforceLocked ? (
                <p className="mt-3 text-sm text-amber-700">
                  {featureRequirements.salesforceIntegration.description}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {salesforceLocked ? (
                  <button
                    className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                    onClick={() => setSalesforceLockedOpen(true)}
                    type="button"
                  >
                    Upgrade for Salesforce
                  </button>
                ) : isConnected ? (
                  <button
                    className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
                    onClick={() => disconnectIntegration(item.id)}
                    type="button"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                    onClick={() => connectIntegration(item.id)}
                    type="button"
                  >
                    Connect
                  </button>
                )}
                <button
                  className="rounded-md border border-blue-300 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white"
                  disabled={item.status === "syncing" || salesforceLocked}
                  onClick={() => {
                    if (salesforceLocked) {
                      setSalesforceLockedOpen(true);
                      return;
                    }
                    testConnection(item.id);
                  }}
                  type="button"
                >
                  Test Connection
                </button>
              </div>
            </Card>
          );
        })}
      </section>

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
                saveMockSession({ ...session, plan: "pro" });
                setSalesforceLockedOpen(false);
                setToastMessage("Mock plan switched to pro.");
                setToastOpen(true);
              }}
              type="button"
            >
              Upgrade to Pro
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
