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
  heroFrom: string;
  heroTo: string;
  heroText: string;
  heroMuted: string;
  gold: string;
  goldSoft: string;
  goldText: string;
  chip: string;
  chipText: string;
  danger: string;
  dangerSoft: string;
  success: string;
  warning: string;
  inputBg: string;
  inset: string;
  shadow: string;
};

export const lightColors: AppColors = {
  bg: "#F3EDE6",
  card: "#FFFBF7",
  cardElevated: "#FFFFFF",
  border: "#E4D5C5",
  text: "#1A1410",
  muted: "#7A6E64",
  primary: "#8F2D3A",
  primaryPressed: "#731F2B",
  primarySoft: "#F6E6E4",
  primaryOn: "#FFFBF7",
  accentText: "#7A2430",
  heroTint: "#1C1412",
  heroFrom: "#1C1412",
  heroTo: "#3A2420",
  heroText: "#F7EFE4",
  heroMuted: "#C4B5A5",
  gold: "#C6A36A",
  goldSoft: "#F4E9D4",
  goldText: "#7A5C28",
  chip: "#F0E6D8",
  chipText: "#5C4F44",
  danger: "#C24141",
  dangerSoft: "#FDECEC",
  success: "#2D6A4F",
  warning: "#B45309",
  inputBg: "#FFFBF7",
  inset: "#EBE2D6",
  shadow: "#1A1410"
};

export const darkColors: AppColors = {
  bg: "#0D0B0A",
  card: "#1A1513",
  cardElevated: "#241E1B",
  border: "#3A312C",
  text: "#F6EEE4",
  muted: "#A89888",
  primary: "#D4B483",
  primaryPressed: "#C4A36A",
  primarySoft: "#2A2318",
  primaryOn: "#1A1410",
  accentText: "#E8C48A",
  heroTint: "#0A0807",
  heroFrom: "#0A0807",
  heroTo: "#1A1410",
  heroText: "#F6EEE4",
  heroMuted: "#B8A898",
  gold: "#E8C48A",
  goldSoft: "#2A2318",
  goldText: "#E8C48A",
  chip: "#241E1B",
  chipText: "#D4C4B4",
  danger: "#F07171",
  dangerSoft: "#3A1515",
  success: "#5DCAA0",
  warning: "#F0C36A",
  inputBg: "#14110F",
  inset: "#14110F",
  shadow: "#000000"
};

export const palettes = {
  light: lightColors,
  dark: darkColors
} as const;
