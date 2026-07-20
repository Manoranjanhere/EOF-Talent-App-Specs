import { apiRequest } from "./api-client";

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
  return apiRequest(`/search/members?${params.toString()}`, { token });
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
  return apiRequest(`/search/jobs?${params.toString()}`, { token });
}
