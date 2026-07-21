import { apiRequest } from "./api-client";
import { mediaUrl } from "./albums.service";
import { prepareImageForUpload, uploadMultipartWithRetry } from "./media-upload";

export function listPublishedTags() {
  return apiRequest<Array<{ id: string; slug: string; title: string }>>("/tags");
}

export function getProfile(userId: string, token: string) {
  return apiRequest(`/profiles/${userId}`, { token });
}

export function rateTalent(
  token: string,
  talentUserId: string,
  payload: { ratingValue: number; comments?: string }
) {
  return apiRequest(`/profiles/${talentUserId}/rate`, {
    method: "POST",
    token,
    body: payload
  });
}

export function listOrgTypes() {
  return apiRequest<Array<{ id: number; name: string }>>("/profiles/org-types");
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

export function setProfileTags(
  token: string,
  payload: { primaryTagIds: string[]; secondaryTagIds: string[] }
) {
  return apiRequest("/profiles/tags/me", {
    method: "POST",
    token,
    body: payload
  });
}

export async function uploadProfilePhoto(token: string, uri: string, _mimeType: string) {
  const prepared = await prepareImageForUpload(uri);
  const buildForm = () => {
    const form = new FormData();
    form.append("file", {
      uri: prepared.uri,
      name: "profile.jpg",
      type: prepared.mimeType
    } as any);
    return form;
  };

  return uploadMultipartWithRetry({
    path: "/media/profile-photo/upload",
    token,
    form: buildForm(),
    timeoutMs: 120_000,
    retries: 3,
    rebuildForm: buildForm
  });
}

export { mediaUrl };
