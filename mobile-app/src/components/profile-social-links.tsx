import React from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import { useTheme } from "../theme/theme-context";

export type ProfileLinkItem = {
  label: string;
  url?: string | null;
};

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

async function openProfileLink(url: string) {
  const normalized = normalizeUrl(url);
  if (!normalized) return;
  try {
    await Linking.openURL(normalized);
  } catch {
    Alert.alert("Cannot open link", normalized);
  }
}

export function ProfileSocialLinks({ links }: { links: ProfileLinkItem[] }) {
  const { colors } = useTheme();
  const visible = links.filter((link) => link.url?.trim());

  if (!visible.length) return null;

  return (
    <View style={{ width: "100%", gap: 8, marginTop: 4 }}>
      <Text
        style={{
          color: colors.muted,
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 0.4,
          textTransform: "uppercase",
          textAlign: "center"
        }}
      >
        Links
      </Text>
      {visible.map((link) => (
        <Pressable
          key={link.label}
          onPress={() => void openProfileLink(link.url!)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.75 : 1,
            alignSelf: "center",
            maxWidth: "100%",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.primary,
            backgroundColor: colors.primarySoft,
            overflow: "hidden"
          })}
        >
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700", textAlign: "center" }}>
            {link.label}
          </Text>
          <Text
            style={{ color: colors.muted, fontSize: 12, marginTop: 2, textAlign: "center" }}
            numberOfLines={1}
          >
            {displayUrl(link.url!.trim())}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function profileLinksFromData(profile: {
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  snapchatUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
}): ProfileLinkItem[] {
  return [
    { label: "Website", url: profile.websiteUrl },
    { label: "Instagram", url: profile.instagramUrl },
    { label: "Facebook", url: profile.facebookUrl },
    { label: "Snapchat", url: profile.snapchatUrl },
    { label: "YouTube", url: profile.youtubeUrl },
    { label: "TikTok", url: profile.tiktokUrl }
  ];
}
