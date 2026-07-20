import { apiRequest } from "./api-client";

export type AdminUser = {
  id: string;
  fullName: string;
  email?: string | null;
  mobileNumber?: string | null;
  city?: string | null;
  country?: string | null;
  isActive: boolean;
  loginEnabled: boolean;
  loginAttempts: number;
  roles: { groupId: number; title: string }[];
  createdAt: string;
  lastUpdateAt: string;
};

export type FlagReason =
  | "FINANCIAL_SCAM"
  | "OBSCENE"
  | "CHILD_ABUSE"
  | "PORNOGRAPHY";

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

export function flagUser(
  token: string,
  payload: { reportedUserId: string; reason: FlagReason; details?: string }
) {
  return apiRequest("/moderation/flags", {
    method: "POST",
    token,
    body: payload
  });
}

export function listAdminUsers(
  token: string,
  query: {
    q?: string;
    status?: "all" | "active" | "banned";
    loginEnabled?: "all" | "yes" | "no";
  } = {}
) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return apiRequest<{ page: number; pageSize: number; total: number; items: AdminUser[] }>(
    `/users${qs ? `?${qs}` : ""}`,
    { token }
  );
}

export function banUser(token: string, userId: string, notes?: string) {
  return apiRequest(`/users/${userId}/ban`, {
    method: "PATCH",
    token,
    body: { notes }
  });
}

export function unbanUser(token: string, userId: string, notes?: string) {
  return apiRequest(`/users/${userId}/unban`, {
    method: "PATCH",
    token,
    body: { notes }
  });
}

export function setUserLoginEnabled(token: string, userId: string, loginEnabled: boolean) {
  return apiRequest(`/users/${userId}/login-enabled`, {
    method: "PATCH",
    token,
    body: { loginEnabled }
  });
}
