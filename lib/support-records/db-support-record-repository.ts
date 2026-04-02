import { randomUUID } from "node:crypto";
import {
  ensureAuthDatabaseSchema,
  getAuthDatabase,
} from "@/lib/auth/database";
import type {
  StoredSupportRecord,
  SupportRecordInput,
  SupportRecordInputMethod,
  SupportRecordSourceType,
} from "@/types";
import type { SupportRecordRepository } from "./repository";

type SupportRecordRow = {
  id: string;
  user_id: string;
  source_type: SupportRecordSourceType;
  input_method: SupportRecordInputMethod;
  batch_id: string;
  submitted_at: string;
  source_name: string;
  occurred_at: string;
  customer: string;
  channel: StoredSupportRecord["channel"];
  category: StoredSupportRecord["category"];
  subject: string;
  status: StoredSupportRecord["status"];
  priority: StoredSupportRecord["priority"];
  response_minutes: number;
  notes: string;
};

let supportRecordSchemaReadyPromise: Promise<void> | null = null;

function toStoredSupportRecord(row: SupportRecordRow): StoredSupportRecord {
  return {
    id: row.id,
    userId: row.user_id,
    sourceType: row.source_type,
    inputMethod: row.input_method,
    batchId: row.batch_id,
    submittedAt: row.submitted_at,
    sourceName: row.source_name,
    occurredAt: row.occurred_at,
    customer: row.customer,
    channel: row.channel,
    category: row.category,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    responseMinutes: Number(row.response_minutes),
    notes: row.notes,
  };
}

async function ensureSupportRecordDatabaseSchema() {
  await ensureAuthDatabaseSchema();

  if (!supportRecordSchemaReadyPromise) {
    supportRecordSchemaReadyPromise = (async () => {
      const sql = getAuthDatabase();

      await sql`
        CREATE TABLE IF NOT EXISTS support_records (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
          source_type text NOT NULL,
          input_method text NOT NULL,
          batch_id text NOT NULL,
          submitted_at text NOT NULL,
          source_name text NOT NULL,
          occurred_at text NOT NULL,
          customer text NOT NULL,
          channel text NOT NULL,
          category text NOT NULL,
          subject text NOT NULL,
          status text NOT NULL,
          priority text NOT NULL,
          response_minutes double precision NOT NULL,
          notes text NOT NULL
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS support_records_user_id_idx
        ON support_records (user_id)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS support_records_occurred_at_idx
        ON support_records (occurred_at)
      `;
    })().catch((error) => {
      supportRecordSchemaReadyPromise = null;
      throw error;
    });
  }

  await supportRecordSchemaReadyPromise;
}

export class DbSupportRecordRepository implements SupportRecordRepository {
  async listByUserId(userId: string) {
    await ensureSupportRecordDatabaseSchema();
    const sql = getAuthDatabase();
    const rows = (await sql`
      SELECT
        id,
        user_id,
        source_type,
        input_method,
        batch_id,
        submitted_at,
        source_name,
        occurred_at,
        customer,
        channel,
        category,
        subject,
        status,
        priority,
        response_minutes,
        notes
      FROM support_records
      WHERE user_id = ${userId}
      ORDER BY occurred_at DESC
    `) as SupportRecordRow[];

    return rows.map(toStoredSupportRecord);
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
    await ensureSupportRecordDatabaseSchema();
    const sql = getAuthDatabase();
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

    await sql`
      INSERT INTO support_records (
        id,
        user_id,
        source_type,
        input_method,
        batch_id,
        submitted_at,
        source_name,
        occurred_at,
        customer,
        channel,
        category,
        subject,
        status,
        priority,
        response_minutes,
        notes
      )
      VALUES (
        ${record.id},
        ${record.userId},
        ${record.sourceType},
        ${record.inputMethod},
        ${record.batchId},
        ${record.submittedAt},
        ${record.sourceName},
        ${record.occurredAt},
        ${record.customer},
        ${record.channel},
        ${record.category},
        ${record.subject},
        ${record.status},
        ${record.priority},
        ${record.responseMinutes},
        ${record.notes}
      )
    `;

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

    await ensureSupportRecordDatabaseSchema();
    const sql = getAuthDatabase();
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

    for (const record of records) {
      await sql`
        INSERT INTO support_records (
          id,
          user_id,
          source_type,
          input_method,
          batch_id,
          submitted_at,
          source_name,
          occurred_at,
          customer,
          channel,
          category,
          subject,
          status,
          priority,
          response_minutes,
          notes
        )
        VALUES (
          ${record.id},
          ${record.userId},
          ${record.sourceType},
          ${record.inputMethod},
          ${record.batchId},
          ${record.submittedAt},
          ${record.sourceName},
          ${record.occurredAt},
          ${record.customer},
          ${record.channel},
          ${record.category},
          ${record.subject},
          ${record.status},
          ${record.priority},
          ${record.responseMinutes},
          ${record.notes}
        )
      `;
    }

    return records;
  }
}
