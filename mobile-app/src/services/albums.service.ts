import { apiRequest, getApiBaseUrl } from "./api-client";
import { prepareImageForUpload, uploadMultipartWithRetry } from "./media-upload";

/** Prefer signed/full HTTPS URLs from the API. Only fall back to local file proxy for relative keys. */
export function mediaUrl(pathOrKey?: string | null): string | null {
  if (!pathOrKey) return null;
  if (pathOrKey.startsWith("http://") || pathOrKey.startsWith("https://")) {
    return pathOrKey;
  }
  const key = pathOrKey.startsWith("/api/")
    ? pathOrKey.replace(/^\/api/, "")
    : pathOrKey.startsWith("/")
      ? pathOrKey
      : `/media/files/${pathOrKey}`;
  return `${getApiBaseUrl()}${key}`;
}

export function createAlbum(
  token: string,
  payload: { title: string; visibility: "PUBLIC" | "PRIVATE" }
) {
  return apiRequest("/albums", { method: "POST", token, body: payload });
}

export function listMyAlbums(token: string) {
  return apiRequest("/albums/mine", { token });
}

export function getAlbum(token: string, albumId: string) {
  return apiRequest(`/albums/${albumId}`, { token });
}

export function deleteAlbum(token: string, albumId: string) {
  return apiRequest(`/albums/${albumId}`, { method: "DELETE", token });
}

export function deleteAlbumAsset(token: string, albumId: string, assetId: string) {
  return apiRequest(`/albums/${albumId}/assets/${assetId}`, {
    method: "DELETE",
    token
  });
}

export async function uploadAlbumAsset(
  token: string,
  albumId: string,
  uri: string,
  mimeType: string,
  options?: { thumbnailUri?: string | null }
) {
  const isVideo = mimeType.startsWith("video/");
  let uploadUri = uri;
  let uploadMime = mimeType || "image/jpeg";
  let fileName = isVideo ? "clip.mp4" : "photo.jpg";

  if (!isVideo) {
    const prepared = await prepareImageForUpload(uri);
    uploadUri = prepared.uri;
    uploadMime = prepared.mimeType;
    fileName = prepared.name;
  }

  // FormData must be rebuilt per attempt so React Native can re-read the file stream.
  const buildForm = () => {
    const form = new FormData();
    form.append("file", {
      uri: uploadUri,
      name: fileName,
      type: uploadMime
    } as any);
    if (options?.thumbnailUri) {
      form.append("thumbnail", {
        uri: options.thumbnailUri,
        name: "thumb.jpg",
        type: "image/jpeg"
      } as any);
    }
    return form;
  };

  return uploadMultipartWithRetry({
    path: `/albums/${albumId}/assets/upload`,
    token,
    form: buildForm(),
    timeoutMs: isVideo ? 420_000 : 120_000,
    retries: 3,
    rebuildForm: buildForm
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
