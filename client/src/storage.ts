const TAB_KEY = "quiz-tab-key";
const CLIENT_ID_PREFIX = "quiz-client-id:";
const LAST_SEQ_PREFIX = "quiz-last-seq-seen:";
const LEGACY_LAST_SEQ_KEY = "quiz-last-seq-seen";

const createClientId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getOrCreateClientId = (): string => {
  const existingTabKey = sessionStorage.getItem(TAB_KEY);
  const tabKey = existingTabKey && existingTabKey.trim() ? existingTabKey : createClientId();
  if (!existingTabKey) {
    sessionStorage.setItem(TAB_KEY, tabKey);
  }

  const clientStorageKey = `${CLIENT_ID_PREFIX}${tabKey}`;
  const existing = localStorage.getItem(clientStorageKey);
  if (existing && existing.trim()) {
    return existing;
  }

  const clientId = createClientId();
  localStorage.setItem(clientStorageKey, clientId);
  return clientId;
};

export const getLastSeqSeen = (clientId: string): number => {
  const scopedKey = `${LAST_SEQ_PREFIX}${clientId}`;
  const value = localStorage.getItem(scopedKey) ?? localStorage.getItem(LEGACY_LAST_SEQ_KEY);
  const parsed = value ? Number.parseInt(value, 10) : 0;
  if (!Number.isInteger(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

export const setLastSeqSeen = (clientId: string, seq: number): void => {
  const scopedKey = `${LAST_SEQ_PREFIX}${clientId}`;
  localStorage.setItem(scopedKey, String(Math.max(0, Math.floor(seq))));
};
