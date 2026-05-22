import { apiRequest } from "./api-client";

export function listJobs() {
  return apiRequest("/jobs");
}

export function postJob(token: string, payload: Record<string, unknown>) {
  return apiRequest("/jobs", {
    method: "POST",
    token,
    body: payload
  });
}
