import type { SettingsAuditLogEntry, SettingsState } from "@/types";

export const settingsStorageKey = "settings:page:v1";

export const defaultSettings: SettingsState = {
  fullName: "Jordan Lee",
  email: "jordan.lee@accesspath.example",
  organizationName: "AccessPath Operations",
  teamSize: "42",
  twoFactorEnabled: true,
  sessionAlertsEnabled: true,
  productUpdatesEnabled: false,
  incidentAlertsEnabled: true,
};

export const settingsAuditLog: SettingsAuditLogEntry[] = [
  {
    id: "audit-1001",
    event: "Password updated",
    actor: "Jordan Lee",
    status: "Success",
    time: "2026-03-09 14:20",
  },
  {
    id: "audit-1002",
    event: "Failed login attempt",
    actor: "Unknown device",
    status: "Warning",
    time: "2026-03-09 09:12",
  },
  {
    id: "audit-1003",
    event: "SSO sync completed",
    actor: "Identity Provider",
    status: "Success",
    time: "2026-03-08 18:05",
  },
  {
    id: "audit-1004",
    event: "Notification delivery error",
    actor: "Email Service",
    status: "Failed",
    time: "2026-03-08 08:41",
  },
];
