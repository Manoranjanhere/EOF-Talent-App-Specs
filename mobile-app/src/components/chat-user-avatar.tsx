import React from "react";
import { Pressable, Text, View } from "react-native";
import { CachedMediaImage } from "./cached-media-image";
import { useTheme } from "../theme/theme-context";

export function ChatUserAvatar({
  name,
  uri,
  cacheKey,
  size = 36,
  onPress
}: {
  name: string;
  uri?: string | null;
  cacheKey?: string | null;
  size?: number;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const initial = (name || "?").slice(0, 1).toUpperCase();
  const fontSize = Math.max(12, Math.round(size * 0.42));

  const avatar = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: colors.primarySoft,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {uri ? (
        <CachedMediaImage uri={uri} cacheKey={cacheKey} style={{ width: "100%", height: "100%" }} />
      ) : (
        <Text style={{ color: colors.primary, fontWeight: "800", fontSize: fontSize }}>{initial}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={8}>
        {avatar}
      </Pressable>
    );
  }

  return avatar;
}
