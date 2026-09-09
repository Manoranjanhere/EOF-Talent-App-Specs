export const APPLICATION_STATUSES = [
  { value: "APPLIED", label: "Applied" },
  { value: "SHORTLIST", label: "Shortlist" },
  { value: "WAITLIST", label: "Waitlist" },
  { value: "INTERVIEWED", label: "Interviewed" },
  { value: "SELECTED", label: "Selected" },
  { value: "HIRED", label: "Hired" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
  { value: "REJECTED", label: "Rejected" }
] as const;

export type ApplicationStatusValue = (typeof APPLICATION_STATUSES)[number]["value"];

export function applicationStatusLabel(status?: string | null) {
  return APPLICATION_STATUSES.find((s) => s.value === status)?.label ?? "Applied";
}
