import type {
  SupportRecordCsvRow,
  SupportRecordErrorResponse,
  SupportRecordImportRowError,
  SupportRecordInput,
} from "@/types";
import { validateSupportRecordInput } from "./validation";

const expectedHeaders = [
  "occurredAt",
  "customer",
  "channel",
  "category",
  "subject",
  "status",
  "priority",
  "responseMinutes",
  "notes",
] as const;

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function splitCsvLines(csvText: string) {
  return csvText
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function buildSupportRecordsCsvTemplate() {
  return [
    expectedHeaders.join(","),
    '2026-03-28T09:30,Jane Doe,Web Chat,Delivery,"Package still not delivered",Open,High,18.5,"Customer asked for updated ETA"',
  ].join("\n");
}

export function parseSupportRecordCsvImport(input: {
  sourceName: string;
  csvText: string;
}):
  | { success: true; data: SupportRecordInput[] }
  | { success: false; error: SupportRecordErrorResponse } {
  const sourceName = input.sourceName.trim();
  const csvText = input.csvText.trim();

  if (!sourceName) {
    return {
      success: false,
      error: {
        error: "A source name is required for CSV import.",
        fieldErrors: { sourceName: "Enter a source name." },
      },
    };
  }

  if (!csvText) {
    return {
      success: false,
      error: {
        error: "CSV content is required.",
        fieldErrors: { csvText: "Choose a CSV file to import." },
      },
    };
  }

  const lines = splitCsvLines(csvText);
  if (lines.length < 2) {
    return {
      success: false,
      error: {
        error: "CSV import requires a header row and at least one record.",
        fieldErrors: { csvText: "Add at least one record row to the CSV." },
      },
    };
  }

  const headers = parseCsvLine(lines[0]);
  const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    return {
      success: false,
      error: {
        error: "CSV headers do not match the expected template.",
        fieldErrors: {
          csvText: `Missing headers: ${missingHeaders.join(", ")}`,
        },
      },
    };
  }

  const rowErrors: SupportRecordImportRowError[] = [];
  const records: SupportRecordInput[] = [];

  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const cells = parseCsvLine(line);
    const csvRow = Object.fromEntries(
      headers.map((header, headerIndex) => [header, cells[headerIndex] ?? ""]),
    ) as Record<(typeof expectedHeaders)[number], string>;
    const payload: SupportRecordInput | SupportRecordCsvRow = {
      sourceName,
      occurredAt: csvRow.occurredAt,
      customer: csvRow.customer,
      channel: csvRow.channel as SupportRecordInput["channel"],
      category: csvRow.category as SupportRecordInput["category"],
      subject: csvRow.subject,
      status: csvRow.status as SupportRecordInput["status"],
      priority: csvRow.priority as SupportRecordInput["priority"],
      responseMinutes: Number(csvRow.responseMinutes),
      notes: csvRow.notes,
    };

    const validation = validateSupportRecordInput(payload);
    if (!validation.success) {
      const message =
        validation.error.error ||
        "This row does not match the support record template.";
      rowErrors.push({ rowNumber, message });
      return;
    }

    records.push(validation.data);
  });

  if (rowErrors.length > 0) {
    return {
      success: false,
      error: {
        error: "CSV import has validation errors.",
        rowErrors,
      },
    };
  }

  return {
    success: true,
    data: records,
  };
}
