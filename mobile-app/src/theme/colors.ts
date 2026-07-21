export type ThemeMode = "light" | "dark";

export type AppColors = {
  bg: string;
  card: string;
  cardElevated: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  primaryOn: string;
  accentText: string;
  heroTint: string;
  chip: string;
  chipText: string;
  danger: string;
  dangerSoft: string;
  success: string;
  warning: string;
  inputBg: string;
  inset: string;
};

export const lightColors: AppColors = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
  primary: "#2563EB",
  primaryPressed: "#1D4ED8",
  primarySoft: "#EFF6FF",
  primaryOn: "#FFFFFF",
  accentText: "#1D4ED8",
  heroTint: "#EEF2FF",
  chip: "#F1F5F9",
  chipText: "#475569",
  danger: "#DC2626",
  dangerSoft: "#FEF2F2",
  success: "#059669",
  warning: "#D97706",
  inputBg: "#FFFFFF",
  inset: "#F1F5F9"
};

export const darkColors: AppColors = {
  bg: "#0B1120",
  card: "#1E293B",
  cardElevated: "#273449",
  border: "#334155",
  text: "#F8FAFC",
  muted: "#94A3B8",
  primary: "#818CF8",
  primaryPressed: "#6366F1",
  primarySoft: "#312E81",
  primaryOn: "#FFFFFF",
  accentText: "#C7D2FE",
  heroTint: "#1E1B4B",
  chip: "#1E293B",
  chipText: "#CBD5E1",
  danger: "#F87171",
  dangerSoft: "#450A0A",
  success: "#34D399",
  warning: "#FBBF24",
  inputBg: "#0F172A",
  inset: "#0F172A"
};

export const palettes = {
  light: lightColors,
  dark: darkColors
} as const;
