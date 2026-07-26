declare const process: { env: Record<string, string | undefined> };

type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

const SESSION_KEY = "eof.auth.session.v1";

export type PersistedSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    fullName: string;
    roles: number[];
  };
};

function loadSecureStore(): SecureStoreModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-secure-store") as SecureStoreModule;
  } catch {
    return null;
  }
}

/** In-memory fallback when SecureStore is unavailable (web / missing native module). */
let memorySession: string | null = null;

export async function loadSession(): Promise<PersistedSession | null> {
  try {
    const store = loadSecureStore();
    const raw = store ? await store.getItemAsync(SESSION_KEY) : memorySession;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user?.id) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(session: PersistedSession): Promise<void> {
  const raw = JSON.stringify(session);
  const store = loadSecureStore();
  if (store) {
    await store.setItemAsync(SESSION_KEY, raw);
  } else {
    memorySession = raw;
  }
}

export async function clearSession(): Promise<void> {
  const store = loadSecureStore();
  if (store) {
    await store.deleteItemAsync(SESSION_KEY);
  }
  memorySession = null;
}

export function playBillingBypassEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_PLAY_BILLING_BYPASS;
  return Boolean(flag && ["true", "1", "yes"].includes(flag.toLowerCase()));
}
