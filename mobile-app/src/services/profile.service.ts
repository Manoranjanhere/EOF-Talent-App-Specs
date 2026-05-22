import { apiRequest } from "./api-client";

export function getProfile(userId: string, token: string) {
  return apiRequest(`/profiles/${userId}`, { token });
}

export function updateTalentProfile(
  token: string,
  payload: Record<string, unknown>
) {
  return apiRequest("/profiles/talent/me", {
    method: "PATCH",
    token,
    body: payload
  });
}

export function updateOrgProfile(token: string, payload: Record<string, unknown>) {
  return apiRequest("/profiles/org/me", {
    method: "PATCH",
    token,
    body: payload
  });
}

export function setProfileTags(token: string, payload: { primaryTagIds: string[]; secondaryTagIds: string[] }) {
  return apiRequest("/profiles/tags/me", {
    method: "POST",
    token,
    body: payload
  });
}
