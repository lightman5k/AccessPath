import { authConfig } from "@/lib/auth/config";
import { mutateJsonFile, readJsonFile } from "@/lib/auth/file-store";
import type { StoredIntegrationState } from "@/types";

const defaultStoredIntegrationStates: StoredIntegrationState[] = [];

export class FileIntegrationRepository {
  constructor(private readonly integrationStatesFilePath = authConfig.integrationStatesFilePath) {}

  async listStatesByUserId(userId: string) {
    const items = await readJsonFile(
      this.integrationStatesFilePath,
      defaultStoredIntegrationStates,
    );
    return items.filter((item) => item.userId === userId);
  }

  async upsertState(item: StoredIntegrationState) {
    let updatedItem: StoredIntegrationState | null = null;

    await mutateJsonFile(
      this.integrationStatesFilePath,
      defaultStoredIntegrationStates,
      (currentItems) => {
        const existingIndex = currentItems.findIndex(
          (entry) =>
            entry.userId === item.userId && entry.integrationId === item.integrationId,
        );

        if (existingIndex === -1) {
          updatedItem = item;
          return [...currentItems, item];
        }

        updatedItem = item;
        return currentItems.map((entry, index) => (index === existingIndex ? item : entry));
      },
    );

    return updatedItem!;
  }
}
