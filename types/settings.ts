export type SettingsState = {
  fullName: string;
  email: string;
  organizationName: string;
  teamSize: string;
  twoFactorEnabled: boolean;
  sessionAlertsEnabled: boolean;
  productUpdatesEnabled: boolean;
  incidentAlertsEnabled: boolean;
};

export type AuditLogStatus = "Success" | "Warning" | "Failed";

export type SettingsAuditLogEntry = {
  id: string;
  event: string;
  actor: string;
  status: AuditLogStatus;
  time: string;
};
