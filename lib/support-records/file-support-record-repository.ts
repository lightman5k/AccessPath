import { randomUUID } from "node:crypto";
import { authConfig } from "@/lib/auth/config";
import { mutateJsonFile, readJsonFile } from "@/lib/auth/file-store";
import type {
  StoredSupportRecord,
  SupportRecordInput,
  SupportRecordInputMethod,
  SupportRecordSourceType,
} from "@/types";

const defaultStoredSupportRecords: StoredSupportRecord[] = [];

export class FileSupportRecordRepository {
  constructor(private readonly filePath = authConfig.supportRecordsFilePath) {}

  async listByUserId(userId: string) {
    const items = await readJsonFile(this.filePath, defaultStoredSupportRecords);
    return items
      .filter((item) => item.userId === userId)
      .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt));
  }

  async create(
    userId: string,
    input: SupportRecordInput,
    options: {
      sourceType: SupportRecordSourceType;
      inputMethod: SupportRecordInputMethod;
      batchId?: string;
      submittedAt?: string;
    },
  ) {
    const submittedAt = options.submittedAt ?? new Date().toISOString();
    const record: StoredSupportRecord = {
      id: randomUUID(),
      userId,
      sourceType: options.sourceType,
      inputMethod: options.inputMethod,
      batchId: options.batchId ?? randomUUID(),
      submittedAt,
      ...input,
    };

    await mutateJsonFile(this.filePath, defaultStoredSupportRecords, (currentItems) => [
      record,
      ...currentItems,
    ]);

    return record;
  }

  async createMany(
    userId: string,
    inputs: SupportRecordInput[],
    options: {
      sourceType: SupportRecordSourceType;
      inputMethod: SupportRecordInputMethod;
    },
  ) {
    if (inputs.length === 0) return [];

    const submittedAt = new Date().toISOString();
    const batchId = randomUUID();
    const records: StoredSupportRecord[] = inputs.map((input) => ({
      id: randomUUID(),
      userId,
      sourceType: options.sourceType,
      inputMethod: options.inputMethod,
      batchId,
      submittedAt,
      ...input,
    }));

    await mutateJsonFile(this.filePath, defaultStoredSupportRecords, (currentItems) => [
      ...records,
      ...currentItems,
    ]);

    return records;
  }
}
