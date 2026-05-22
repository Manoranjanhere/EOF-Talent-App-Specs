import { apiRequest } from "./api-client";

export function listFlagReports(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest(`/moderation/flags${query}`, { token });
}

export function takeAdminAction(
  token: string,
  payload: {
    reportId: string;
    actionType: "WARN" | "SUSPEND" | "DEACTIVATE" | "BAN" | "NOTE";
    reportStatus: "OPEN" | "REVIEWING" | "ACTIONED" | "REJECTED";
    notes?: string;
  }
) {
  return apiRequest("/moderation/actions", {
    method: "POST",
    token,
    body: payload
  });
}
