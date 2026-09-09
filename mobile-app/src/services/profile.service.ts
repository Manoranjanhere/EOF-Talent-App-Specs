import { apiRequest } from "./api-client";
import { mediaUrl } from "./albums.service";
import { prepareImageForUpload, uploadMultipartWithRetry } from "./media-upload";

export function listPublishedTags() {
  return apiRequest<Array<{ id: string; slug: string; title: string }>>("/tags");
}

export type CompletedGig = {
  applicationId: string;
  jobId: string;
  title: string;
  employerUserId: string;
  employerName: string;
  completedAt?: string | null;
  rating?: number | null;
  comments?: string | null;
};

export type EmployerStats = {
  gigsPosted: number;
  gigsCompleted: number;
  avgRating: number;
};

export type PublicProfile = {
  id: string;
  fullName: string;
  age?: number | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  city?: string | null;
  country?: string | null;
  miniBio?: string | null;
  isAvailable?: boolean;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  snapchatUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  facebookUrl?: string | null;
  defaultOrgTypeId?: number | null;
  ratingAverage?: number | string;
  ratingCount?: number;
  myRating?: number | null;
  seriousAboutJob?: boolean;
  profilePhotoUrl?: string | null;
  profilePhotoObjectKey?: string | null;
  profilePhotoAssetId?: string | null;
  profileOrg?: {
    orgTypeId?: number;
    legalName?: string | null;
    addressLine?: string | null;
    taxId?: string | null;
    contactName?: string | null;
    contactPosition?: string | null;
    contactNumber?: string | null;
    contactEmail?: string | null;
  } | null;
  profileTags?: Array<{
    isActive?: boolean;
    tagId?: string;
    linkType?: string;
    tag?: { title?: string };
  }>;
  roles?: Array<{ groupId: number }>;
  mediaAssets?: Array<{ isProfilePhoto?: boolean }>;
  completedGigs?: CompletedGig[];
  employerStats?: EmployerStats | null;
};

export function getProfile(userId: string, token: string) {
  return apiRequest<PublicProfile>(`/profiles/${userId}`, { token });
}

export function rateTalent(
  token: string,
  talentUserId: string,
  payload: { ratingValue: number; comments?: string; jobId?: string }
) {
  return apiRequest<PublicProfile>(`/profiles/${talentUserId}/rate`, {
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
