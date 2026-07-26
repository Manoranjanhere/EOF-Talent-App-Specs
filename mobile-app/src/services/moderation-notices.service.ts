import { apiRequest } from "./api-client";

export type AdminWarningNotice = {
  id: string;
  actionType: string;
  notes?: string | null;
  createdAt: string;
};

export function listMyWarnings(token: string) {
  return apiRequest<AdminWarningNotice[]>("/moderation/warnings/me", { token });
}

export function acknowledgeWarning(token: string, warningId: string) {
  return apiRequest(`/moderation/warnings/${warningId}/acknowledge`, {
    method: "PATCH",
    token
  });
}
