import type {
  StoredSupportRecord,
  SupportRecordInput,
  SupportRecordInputMethod,
  SupportRecordSourceType,
} from "@/types";

export interface SupportRecordRepository {
  listByUserId(userId: string): Promise<StoredSupportRecord[]>;
  create(
    userId: string,
    input: SupportRecordInput,
    options: {
      sourceType: SupportRecordSourceType;
      inputMethod: SupportRecordInputMethod;
      batchId?: string;
      submittedAt?: string;
    },
  ): Promise<StoredSupportRecord>;
  createMany(
    userId: string,
    inputs: SupportRecordInput[],
    options: {
      sourceType: SupportRecordSourceType;
      inputMethod: SupportRecordInputMethod;
    },
  ): Promise<StoredSupportRecord[]>;
}
