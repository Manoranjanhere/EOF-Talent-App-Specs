import React from "react";
import { Pressable, Text, View } from "react-native";
import { CachedMediaImage } from "./cached-media-image";
import { TagChips } from "./ui";
import { useTheme } from "../theme/theme-context";

export function ProfileHero({
  name,
  subtitle,
  avatarUri,
  avatarKey,
  meta,
  tags,
  bio,
  onAvatarPress
}: {
  name: string;
  subtitle?: string;
  avatarUri?: string | null;
  avatarKey?: string | null;
  meta?: string;
  tags?: string[];
  bio?: string | null;
  onAvatarPress?: () => void;
}) {
  const { colors } = useTheme();
  const initial = (name || "?").slice(0, 1).toUpperCase();
  const size = 96;

  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        marginBottom: 8,
        paddingVertical: 8,
        gap: 12
      }}
    >
      <Pressable
        onPress={onAvatarPress}
        disabled={!onAvatarPress}
        style={{
          width: size + 8,
          height: size + 8,
          borderRadius: (size + 8) / 2,
          backgroundColor: colors.primarySoft,
          borderWidth: 2,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
            backgroundColor: colors.inset
          }}
        >
          {avatarUri ? (
            <CachedMediaImage
              uri={avatarUri}
              cacheKey={avatarKey}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: colors.primary, fontSize: 32, fontWeight: "800" }}>{initial}</Text>
            </View>
          )}
        </View>
      </Pressable>

      {onAvatarPress && avatarUri ? (
        <Text style={{ color: colors.muted, fontSize: 11 }}>Tap photo to enlarge</Text>
      ) : null}

      <View style={{ alignItems: "center", gap: 6, paddingHorizontal: 16, width: "100%" }}>
        <Text
          style={{ color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.3, textAlign: "center" }}
          numberOfLines={2}
        >
          {name}
        </Text>
        {subtitle ? (
          <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center" }} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <View
            style={{
              backgroundColor: colors.chip,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              maxWidth: "100%"
            }}
          >
            <Text
              style={{ color: colors.chipText, fontSize: 12, fontWeight: "600", textAlign: "center" }}
              numberOfLines={2}
            >
              {meta}
            </Text>
          </View>
        ) : null}
        {tags?.length ? <TagChips tags={tags} /> : null}
        {bio ? (
          <Text
            style={{
              color: colors.text,
              fontSize: 15,
              lineHeight: 22,
              textAlign: "center",
              marginTop: 4,
              paddingHorizontal: 4
            }}
          >
            {bio}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
