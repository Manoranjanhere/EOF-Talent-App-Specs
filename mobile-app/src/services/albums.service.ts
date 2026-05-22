import { apiRequest } from "./api-client";

export function createAlbum(
  token: string,
  payload: { title: string; visibility: "PUBLIC" | "PRIVATE" }
) {
  return apiRequest("/albums", { method: "POST", token, body: payload });
}

export function addAlbumAsset(
  token: string,
  albumId: string,
  payload: Record<string, unknown>
) {
  return apiRequest(`/albums/${albumId}/assets`, {
    method: "POST",
    token,
    body: payload
  });
}

export function listAlbumGrants(token: string, albumId: string) {
  return apiRequest(`/albums/${albumId}/access-grants`, { token });
}

export function grantAlbumAccess(
  token: string,
  albumId: string,
  payload: { grantedToUserId: string; grantedDays: 30 | 60 | 90 }
) {
  return apiRequest(`/albums/${albumId}/access-grants`, {
    method: "POST",
    token,
    body: payload
  });
}

export function revokeAlbumAccess(token: string, grantId: string) {
  return apiRequest(`/albums/access-grants/${grantId}`, {
    method: "DELETE",
    token
  });
}
