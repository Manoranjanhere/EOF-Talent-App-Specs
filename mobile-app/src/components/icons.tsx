import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconProps = {
  color?: string;
  size?: number;
};

export function HomeIcon({ color = "#1D4ED8", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DiscoverIcon({ color = "#1D4ED8", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth={1.8} />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function JobsIcon({ color = "#1D4ED8", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="7" width="18" height="13" rx="2" stroke={color} strokeWidth={1.8} />
      <Path
        d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path d="M3 12h18" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function ChatIcon({ color = "#1D4ED8", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AlbumsIcon({ color = "#1D4ED8", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="14" height="12" rx="1.5" stroke={color} strokeWidth={1.8} />
      <Path d="M7 19h12a1 1 0 0 0 1-1V8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="9.5" cy="9.5" r="1.2" fill={color} />
      <Path
        d="M6.5 15l3-3 2 2 3.5-4 2.5 5H6.5z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ProfileIcon({ color = "#1D4ED8", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={1.8} />
      <Path
        d="M5 19.5c1.5-3.2 4-4.8 7-4.8s5.5 1.6 7 4.8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function HelpIcon({ color = "#1D4ED8", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={1.8} />
      <Path
        d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.25c-.8.45-1.35 1-1.35 2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="16.5" r="1" fill={color} />
    </Svg>
  );
}

export function PostJobIcon({ color = "#1D4ED8", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={1.8} />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ReportsIcon({ color = "#1D4ED8", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M9 11h6M9 15h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function UsersIcon({ color = "#1D4ED8", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth={1.8} />
      <Circle cx="16.5" cy="9" r="2.4" stroke={color} strokeWidth={1.8} />
      <Path
        d="M3.5 19c1.2-2.8 3.2-4.2 5.5-4.2s4.3 1.4 5.5 4.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M14 14.2c1.5-.4 3-.1 4.5 1.3.8.8 1.4 1.8 1.8 3"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Brand mark — E lettermark */
export function AppLogoIcon({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Rect width="64" height="64" rx="14" fill="#1D4ED8" />
      <Path
        d="M18 16h28v5.5H24.5v6.5H43v5.5H24.5v7H46.5V46H18V16z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

export function SunIcon({ color = "#F59E0B", size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MoonIcon({ color = "#6366F1", size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 13.5A7.5 7.5 0 1 1 10.5 5 6 6 0 0 0 19 13.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EyeIcon({ color = "#64748B", size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function EyeOffIcon({ color = "#64748B", size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3l18 18M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M6.1 6.3C3.9 7.9 2.5 12 2.5 12s3.5 7 9.5 7c1.9 0 3.6-.5 5.1-1.3M17.7 14.5C19.7 13 21.5 12 21.5 12s-3.5-7-9.5-7c-.9 0-1.7.1-2.5.3"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronBackIcon({ color = "#0F172A", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.5 6L9 12l5.5 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SendIcon({ color = "#fff", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </Svg>
  );
}

export const tabIcons = {
  Home: HomeIcon,
  Discover: DiscoverIcon,
  Jobs: JobsIcon,
  Chat: ChatIcon,
  Albums: AlbumsIcon,
  Profile: ProfileIcon,
  Help: HelpIcon,
  PostJob: PostJobIcon,
  Reports: ReportsIcon,
  Users: UsersIcon
} as const;

export type TabRouteName = keyof typeof tabIcons;
