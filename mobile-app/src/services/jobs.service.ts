import { apiRequest } from "./api-client";

export type JobPostPayload = {
  title: string;
  miniDescription: string;
  gender?: string;
  ageRangeMin?: number;
  ageRangeMax?: number;
  city?: string;
  country?: string;
  payRangeMin?: number;
  payRangeMax?: number;
  primaryTagIds: string[];
  secondaryTagIds: string[];
};

export function listMyJobs(token: string) {
  return apiRequest("/jobs/mine", { token });
}

export function getMyJob(token: string, jobId: string) {
  return apiRequest(`/jobs/mine/${jobId}`, { token });
}

export function postJob(token: string, payload: JobPostPayload) {
  return apiRequest("/jobs", {
    method: "POST",
    token,
    body: payload
  });
}

export function applyToJob(token: string, jobId: string, message?: string) {
  return apiRequest(`/jobs/${jobId}/apply`, {
    method: "POST",
    token,
    body: { message }
  });
}
