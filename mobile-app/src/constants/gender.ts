export type GenderValue = "Male" | "Female";
export type GenderFilterValue = "all" | GenderValue;
export type JobGenderValue = "any" | GenderValue;

export const GENDER_OPTIONS = [
  { value: "Male" as GenderValue, label: "Male" },
  { value: "Female" as GenderValue, label: "Female" }
];

export const GENDER_FILTER_OPTIONS = [
  { value: "all" as GenderFilterValue, label: "Any" },
  ...GENDER_OPTIONS
];

export const JOB_GENDER_OPTIONS = [
  { value: "any" as JobGenderValue, label: "Any" },
  ...GENDER_OPTIONS
];

export function normalizeGender(value?: string | null): GenderValue | "" {
  if (!value) return "";
  const lower = value.toLowerCase();
  if (lower === "male") return "Male";
  if (lower === "female") return "Female";
  return "";
}

export function formatGenderLabel(value?: string | null): string {
  const normalized = normalizeGender(value);
  return normalized || "Any";
}
