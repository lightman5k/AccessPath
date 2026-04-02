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

export type SettingsField = keyof SettingsState;

export type StoredUserSettings = {
  userId: string;
  teamSize: string;
  twoFactorEnabled: boolean;
  sessionAlertsEnabled: boolean;
  productUpdatesEnabled: boolean;
  incidentAlertsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoredUserSettingsInput = Omit<
  StoredUserSettings,
  "userId" | "createdAt" | "updatedAt"
>;

export type AuditLogStatus = "Success" | "Warning" | "Failed";

export type SettingsAuditLogEntry = {
  id: string;
  event: string;
  actor: string;
  status: AuditLogStatus;
  time: string;
};

export type StoredSettingsAuditLogEntry = SettingsAuditLogEntry & {
  userId: string;
};

export type SettingsApiResponse = {
  settings: SettingsState;
  auditLog: SettingsAuditLogEntry[];
};

export type UpdateSettingsRequest = SettingsState;

export type SettingsErrorResponse = {
  error: string;
  fieldErrors?: Partial<Record<SettingsField, string>>;
};
