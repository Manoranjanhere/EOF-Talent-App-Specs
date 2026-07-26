import { apiRequest } from "./api-client";

export type SkillTag = {
  id: string;
  slug: string;
  title: string;
  published?: boolean;
  isActive?: boolean;
};

export function listAdminTags(token: string) {
  return apiRequest<SkillTag[]>("/tags/admin", { token });
}

export function createSkillTag(token: string, payload: { slug: string; title: string }) {
  return apiRequest<SkillTag>("/tags", {
    method: "POST",
    token,
    body: payload
  });
}
