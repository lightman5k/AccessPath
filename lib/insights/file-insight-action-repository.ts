import { authConfig } from "@/lib/auth/config";
import { mutateJsonFile, readJsonFile } from "@/lib/auth/file-store";
import type { StoredInsightActionState } from "@/types";

const defaultStoredInsightActions: StoredInsightActionState[] = [];

export class FileInsightActionRepository {
  constructor(private readonly filePath = authConfig.insightActionsFilePath) {}

  async listByUserId(userId: string) {
    const items = await readJsonFile(this.filePath, defaultStoredInsightActions);
    return items.filter((item) => item.userId === userId);
  }

  async upsert(item: StoredInsightActionState) {
    let updatedItem: StoredInsightActionState | null = null;

    await mutateJsonFile(this.filePath, defaultStoredInsightActions, (currentItems) => {
      const existingIndex = currentItems.findIndex(
        (entry) => entry.userId === item.userId && entry.insightId === item.insightId,
      );

      if (existingIndex === -1) {
        updatedItem = item;
        return [...currentItems, item];
      }

      updatedItem = item;
      return currentItems.map((entry, index) => (index === existingIndex ? item : entry));
    });

    return updatedItem!;
  }
}
