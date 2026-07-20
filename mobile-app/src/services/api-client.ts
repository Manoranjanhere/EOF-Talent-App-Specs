declare const process: { env: Record<string, string | undefined> };

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3000/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
};

function formatApiError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) {
      return parsed.message.join("\n");
    }
    if (parsed.message) {
      return parsed.message;
    }
  } catch {
    // not JSON
  }
  return body || `Request failed (${status})`;
}

export function getApiBaseUrl(): string {
  return API_URL;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const controller = new AbortController();
  const timeoutMs = 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
  } catch (error) {
    const aborted = (error as { name?: string })?.name === "AbortError";
    const hint =
      API_URL.includes("127.0.0.1") || API_URL.includes("localhost")
        ? "\n\nOn a USB phone run: adb reverse tcp:3000 tcp:3000\nThen keep EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api and restart Metro."
        : API_URL.includes("10.0.2.2")
          ? "\n\n10.0.2.2 only works on the emulator. For a real phone use http://127.0.0.1:3000/api with adb reverse, or your PC Wi‑Fi IP."
          : "\n\nCheck backend is running (npm run start:backend), phone and PC are on same Wi‑Fi, and Windows Firewall allows port 3000.";
    throw new Error(
      aborted
        ? `Request timed out after ${timeoutMs / 1000}s. Cannot reach ${url}.${hint}`
        : `Network request failed. Cannot reach ${url}.${hint}`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(formatApiError(response.status, message));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
