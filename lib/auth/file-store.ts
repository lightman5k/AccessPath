import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const fileWriteQueues = new Map<string, Promise<unknown>>();

/**
 * Local/demo-only JSON file storage.
 *
 * Writes are serialized per file inside a single Node process to reduce the
 * chance of clobbering concurrent mutations. This is still not suitable for
 * multi-instance deployments or serverless runtimes with shared-write needs.
 */
export async function readJsonFile<T>(filePath: string, fallbackValue: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    if (!raw.trim()) return fallbackValue;
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return fallbackValue;
    }
    throw error;
  }
}

/**
 * Local/demo-only serialized mutation helper.
 *
 * This keeps JSON writes ordered within one process, but it does not provide
 * cross-process coordination or database-grade durability guarantees.
 */
export async function mutateJsonFile<T>(
  filePath: string,
  fallbackValue: T,
  mutate: (currentValue: T) => Promise<T> | T,
) {
  const previous = fileWriteQueues.get(filePath) ?? Promise.resolve();
  let nextValue!: T;

  const next = previous
    .catch(() => undefined)
    .then(async () => {
      const currentValue = await readJsonFile(filePath, fallbackValue);
      nextValue = await mutate(currentValue);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, `${JSON.stringify(nextValue, null, 2)}\n`, "utf8");
    });

  fileWriteQueues.set(filePath, next);

  try {
    await next;
    return nextValue;
  } finally {
    if (fileWriteQueues.get(filePath) === next) {
      fileWriteQueues.delete(filePath);
    }
  }
}
