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

export type EmployerJobSummary = {
  id: string;
  title: string;
  miniDescription: string;
  validTill: string;
  city?: string | null;
  country?: string | null;
  applications?: unknown[];
};

export type JobApplicationDetail = {
  id: string;
  message?: string | null;
  status?: string;
  jobCompleted?: boolean;
  createdAt: string;
  applicant?: {
    id: string;
    fullName: string;
    city?: string | null;
    country?: string | null;
    ratingAverage?: number | string | null;
    profileTags?: Array<{ tag?: { title?: string } }>;
  };
};

export type JobDetail = {
  id: string;
  title: string;
  miniDescription: string;
  city?: string | null;
  country?: string | null;
  gender?: string | null;
  ageRangeMin?: number | null;
  ageRangeMax?: number | null;
  payRangeMin?: number | null;
  payRangeMax?: number | null;
  validTill: string;
  applications?: JobApplicationDetail[];
  tags?: Array<{ tag?: { title?: string } }>;
};

export function listMyJobs(token: string) {
  return apiRequest<EmployerJobSummary[]>("/jobs/mine", { token });
}

export function getMyJob(token: string, jobId: string) {
  return apiRequest<JobDetail>(`/jobs/mine/${jobId}`, { token });
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

export function updateApplicationStatus(token: string, applicationId: string, status: string) {
  return apiRequest(`/jobs/applications/${applicationId}/status`, {
    method: "PATCH",
    token,
    body: { status }
  });
}

export function completeApplication(
  token: string,
  applicationId: string,
  payload: { ratingValue: number; comments?: string }
) {
  return apiRequest(`/jobs/applications/${applicationId}/complete`, {
    method: "POST",
    token,
    body: payload
  });
}

export function repostJob(token: string, jobId: string) {
  return apiRequest(`/jobs/${jobId}/repost`, { method: "POST", token });
}

export function referJobInApp(token: string, jobId: string, recipientUserId: string) {
  return apiRequest(`/jobs/${jobId}/refer`, {
    method: "POST",
    token,
    body: { recipientUserId }
  });
}
