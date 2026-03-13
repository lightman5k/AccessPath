import type { ConversationListOverride, ConversationLocalState } from "@/types";

const LEGACY_KEY_PREFIX = "customer-service:detail:";
const KEY_PREFIX = "customer-service:detail:v1:";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function customerServiceStorageKey(id: string) {
  return `${KEY_PREFIX}${id}`;
}

function legacyCustomerServiceStorageKey(id: string) {
  return `${LEGACY_KEY_PREFIX}${id}`;
}

function parseState(raw: string): ConversationLocalState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ConversationLocalState>;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      status: parsed.status as ConversationLocalState["status"],
      assignee: parsed.assignee ?? "",
      priority: parsed.priority as ConversationLocalState["priority"],
      notes: parsed.notes ?? "",
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
      handoffTicket:
        parsed.handoffTicket && typeof parsed.handoffTicket === "object"
          ? parsed.handoffTicket
          : null,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function readCustomerServiceConversationState(
  id: string,
): ConversationLocalState | null {
  if (!canUseStorage()) return null;
  const key = customerServiceStorageKey(id);
  const raw = window.localStorage.getItem(key);
  if (raw) return parseState(raw);

  // Migrate legacy unversioned keys forward on first read.
  const legacyRaw = window.localStorage.getItem(legacyCustomerServiceStorageKey(id));
  if (!legacyRaw) return null;

  const parsed = parseState(legacyRaw);
  if (!parsed) return null;

  window.localStorage.setItem(key, JSON.stringify(parsed));
  window.localStorage.removeItem(legacyCustomerServiceStorageKey(id));
  return parsed;
}

export function writeCustomerServiceConversationState(
  id: string,
  state: ConversationLocalState,
) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(customerServiceStorageKey(id), JSON.stringify(state));
  window.localStorage.removeItem(legacyCustomerServiceStorageKey(id));
}

export function clearCustomerServiceConversationStates() {
  if (!canUseStorage()) return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (key.startsWith(KEY_PREFIX) || key.startsWith(LEGACY_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

export function readCustomerServiceConversationOverrides(): Record<
  string,
  ConversationListOverride
> {
  if (!canUseStorage()) return {};
  const overrides: Record<string, ConversationListOverride> = {};

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    const isVersioned = key.startsWith(KEY_PREFIX);
    const isLegacy = key.startsWith(LEGACY_KEY_PREFIX);
    if (!isVersioned && !isLegacy) continue;

    const id = key.slice(isVersioned ? KEY_PREFIX.length : LEGACY_KEY_PREFIX.length);
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    const state = parseState(raw);
    if (!state) continue;

    if (isLegacy) {
      window.localStorage.setItem(customerServiceStorageKey(id), JSON.stringify(state));
      window.localStorage.removeItem(key);
    }

    overrides[id] = {
      status: state.status,
      assignee: state.assignee,
      priority: state.priority,
      updatedAt: state.updatedAt,
      hasHandoffTicket: Boolean(state.handoffTicket),
    };
  }

  return overrides;
}
