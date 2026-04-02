import type { ConversationStatus, QueuePriority } from "./customer-service";

export type SupportRecordSourceType = "manual" | "csv" | "integration";

export type SupportRecordInputMethod = "form" | "csv";

export type SupportRecordChannel = "Web Chat" | "Email" | "SMS";

export type SupportRecordCategory = "Delivery" | "Returns" | "Billing" | "Account";

export type SupportRecordStatus = ConversationStatus;

export type SupportRecordPriority = QueuePriority;

export type SupportRecordInput = {
  sourceName: string;
  occurredAt: string;
  customer: string;
  channel: SupportRecordChannel;
  category: SupportRecordCategory;
  subject: string;
  status: SupportRecordStatus;
  priority: SupportRecordPriority;
  responseMinutes: number;
  notes: string;
};

export type SupportRecordCsvRow = Omit<SupportRecordInput, "sourceName">;

export type StoredSupportRecord = SupportRecordInput & {
  id: string;
  userId: string;
  sourceType: SupportRecordSourceType;
  inputMethod: SupportRecordInputMethod;
  batchId: string;
  submittedAt: string;
};

export type SupportRecordSourceSummary = {
  sourceName: string;
  totalRecords: number;
  latestSubmittedAt: string;
  latestInputMethod: SupportRecordInputMethod;
  latestCustomer: string;
  latestCategory: SupportRecordCategory;
  latestStatus: SupportRecordStatus;
  latestBatchCount: number;
};

export type SupportRecordImportRowError = {
  rowNumber: number;
  message: string;
};
