import { apiRequest } from "./api-client";

export type MemberSearchCard = {
  id: string;
  title: string;
  subtitle?: string;
  rating?: number | string;
  isAvailable?: boolean;
  tags?: string[];
  roleIds?: number[];
  seriousAboutJob?: boolean;
  profilePhotoUrl?: string | null;
  profilePhotoObjectKey?: string | null;
};

export type MemberSearchResult = {
  page: number;
  pageSize: number;
  total: number;
  cards: MemberSearchCard[];
};

export type JobSearchCard = {
  id: string;
  title: string;
  subtitle?: string;
  location?: string;
  payRange?: [number | null, number | null];
  ageRange?: [number | null, number | null];
  gender?: string;
  validTill?: string;
  tags?: string[];
  postedBy?: string;
  postedByUserId?: string;
  postedByPhotoUrl?: string | null;
  postedByPhotoObjectKey?: string | null;
  hasApplied?: boolean;
};

export type JobSearchResult = {
  page: number;
  pageSize: number;
  total: number;
  cards: JobSearchCard[];
};

export function searchMembers(
  token: string,
  query: Record<string, string | number | undefined>
) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      params.append(key, String(value));
    }
  });
  return apiRequest<MemberSearchResult>(`/search/members?${params.toString()}`, { token });
}

export function searchJobs(
  token: string,
  query: Record<string, string | number | undefined>
) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      params.append(key, String(value));
    }
  });
  return apiRequest<JobSearchResult>(`/search/jobs?${params.toString()}`, { token });
}
