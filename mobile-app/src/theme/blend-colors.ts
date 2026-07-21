import type { AppColors } from "./colors";

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16)
  ];
}

function channelToHex(value: number): string {
  return Math.round(Math.max(0, Math.min(255, value)))
    .toString(16)
    .padStart(2, "0");
}

export function blendHex(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  return `#${channelToHex(r1 + (r2 - r1) * t)}${channelToHex(g1 + (g2 - g1) * t)}${channelToHex(
    b1 + (b2 - b1) * t
  )}`;
}

export function blendPalettes(from: AppColors, to: AppColors, t: number): AppColors {
  const keys = Object.keys(from) as (keyof AppColors)[];
  const blended = {} as AppColors;
  for (const key of keys) {
    blended[key] = blendHex(from[key], to[key], t);
  }
  return blended;
}
