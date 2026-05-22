import { apiRequest } from "./api-client";

export function submitFeedback(token: string, payload: { subject: string; message: string }) {
  return apiRequest("/feedback", {
    method: "POST",
    token,
    body: payload
  });
}

export function listMyFeedback(token: string) {
  return apiRequest("/feedback/me", { token });
}
