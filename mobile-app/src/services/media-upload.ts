import * as ImageManipulator from "expo-image-manipulator";
import { getApiBaseUrl } from "./api-client";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableNetworkError(error: unknown): boolean {
  const message = String((error as Error)?.message || error || "").toLowerCase();
  return (
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("aborted")
  );
}

/** Shrink/normalize images before upload so multi-photo batches are reliable on phone Wi‑Fi. */
export async function prepareImageForUpload(uri: string): Promise<{
  uri: string;
  mimeType: string;
  name: string;
}> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1600 } }],
      {
        compress: 0.55,
        format: ImageManipulator.SaveFormat.JPEG
      }
    );
    return { uri: result.uri, mimeType: "image/jpeg", name: "photo.jpg" };
  } catch {
    return { uri, mimeType: "image/jpeg", name: "photo.jpg" };
  }
}

export async function uploadMultipartWithRetry(input: {
  path: string;
  token: string;
  form: FormData;
  timeoutMs?: number;
  retries?: number;
  rebuildForm?: () => FormData;
}): Promise<unknown> {
  const timeoutMs = input.timeoutMs ?? 120_000;
  const retries = input.retries ?? 3;
  const url = `${getApiBaseUrl()}${input.path}`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const form = attempt === 1 ? input.form : input.rebuildForm?.() ?? input.form;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${input.token}` },
        body: form,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Upload failed (${response.status})`);
      }
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      const aborted = (error as { name?: string })?.name === "AbortError";
      lastError = aborted
        ? new Error(`Upload timed out after ${Math.round(timeoutMs / 1000)}s`)
        : error instanceof Error
          ? error
          : new Error(String(error));

      const statusMatch = /upload failed \((\d+)\)/i.exec(lastError.message);
      const status = statusMatch ? Number(statusMatch[1]) : 0;
      const retriable =
        isRetriableNetworkError(lastError) ||
        aborted ||
        status === 408 ||
        status === 429 ||
        status >= 500;

      if (!retriable || attempt === retries) {
        break;
      }
      await sleep(700 * 2 ** (attempt - 1));
    }
  }

  throw lastError || new Error("Upload failed");
}
