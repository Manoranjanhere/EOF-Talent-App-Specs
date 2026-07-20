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
  danger: string;
  dangerSoft: string;
  success: string;
  warning: string;
  inputBg: string;
  inset: string;
};

export const lightColors: AppColors = {
  bg: "#F4F6F9",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
  primary: "#1D4ED8",
  primaryPressed: "#1E40AF",
  primarySoft: "#EFF6FF",
  primaryOn: "#FFFFFF",
  accentText: "#1E40AF",
  danger: "#DC2626",
  dangerSoft: "#FEF2F2",
  success: "#059669",
  warning: "#D97706",
  inputBg: "#FFFFFF",
  inset: "#F1F5F9"
};

export const darkColors: AppColors = {
  bg: "#0F172A",
  card: "#1E293B",
  cardElevated: "#273449",
  border: "#334155",
  text: "#F8FAFC",
  muted: "#94A3B8",
  primary: "#6366F1",
  primaryPressed: "#4F46E5",
  primarySoft: "#312E81",
  primaryOn: "#FFFFFF",
  accentText: "#C7D2FE",
  danger: "#F87171",
  dangerSoft: "#450A0A",
  success: "#34D399",
  warning: "#FBBF24",
  inputBg: "#0B1220",
  inset: "#0B1220"
};

export const palettes = {
  light: lightColors,
  dark: darkColors
} as const;
