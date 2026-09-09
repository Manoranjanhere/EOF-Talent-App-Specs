import { apiRequest } from "./api-client";

export type PeopleListSummary = {
  id: string;
  title: string;
  _count?: { members: number };
};

export type PeopleListMember = {
  id: string;
  userId: string;
  fullName: string;
  city?: string | null;
  country?: string | null;
  ratingAverage?: number | string | null;
  tags: string[];
  roleIds: number[];
  profilePhotoUrl?: string | null;
  profilePhotoObjectKey?: string | null;
};

export type PeopleListDetail = PeopleListSummary & {
  members: PeopleListMember[];
};

export function listSuggestions(token: string) {
  return apiRequest<string[]>("/lists/suggestions", { token });
}

export function listMyPeopleLists(token: string) {
  return apiRequest<PeopleListSummary[]>("/lists", { token });
}

export function createPeopleList(token: string, title: string) {
  return apiRequest<PeopleListSummary>("/lists", {
    method: "POST",
    token,
    body: { title }
  });
}

export function updatePeopleList(token: string, id: string, title: string) {
  return apiRequest(`/lists/${id}`, {
    method: "PATCH",
    token,
    body: { title }
  });
}

export function deletePeopleList(token: string, id: string) {
  return apiRequest(`/lists/${id}`, { method: "DELETE", token });
}

export function getPeopleList(
  token: string,
  id: string,
  query?: { q?: string; tagIds?: string }
) {
  const params = new URLSearchParams();
  if (query?.q) params.set("q", query.q);
  if (query?.tagIds) params.set("tagIds", query.tagIds);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<PeopleListDetail>(`/lists/${id}${suffix}`, { token });
}

export function addListMember(token: string, listId: string, userId: string) {
  return apiRequest(`/lists/${listId}/members`, {
    method: "POST",
    token,
    body: { userId }
  });
}

export function removeListMember(token: string, listId: string, userId: string) {
  return apiRequest(`/lists/${listId}/members/${userId}`, {
    method: "DELETE",
    token
  });
}
