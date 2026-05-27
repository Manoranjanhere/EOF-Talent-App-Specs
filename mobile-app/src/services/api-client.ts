const API_URL =
  ((globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env?.EXPO_PUBLIC_API_URL ??
    "http://10.0.2.2:3000/api");

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

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    const hint =
      API_URL.includes("localhost") || API_URL.includes("127.0.0.1")
        ? "\n\nOn Android emulator, use EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api in mobile-app/.env"
        : "\n\nCheck backend is running (npm run start:backend) and phone/emulator can reach this URL.";
    throw new Error(`Network request failed. Cannot reach ${url}.${hint}`);
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
