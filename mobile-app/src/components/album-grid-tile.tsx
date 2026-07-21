import React from "react";
import { Pressable, Text, View, ViewStyle } from "react-native";
import { CachedMediaImage } from "./cached-media-image";
import { useTheme } from "../theme/theme-context";

export function AlbumGridTile({
  title,
  coverUri,
  coverKey,
  visibility,
  onPress,
  onLongPress,
  style
}: {
  title: string;
  coverUri?: string | null;
  coverKey?: string | null;
  visibility?: "PUBLIC" | "PRIVATE" | string;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        {
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: colors.inset,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
          elevation: 2,
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6
        },
        style
      ]}
    >
      {coverUri ? (
        <CachedMediaImage uri={coverUri} cacheKey={coverKey} style={{ width: "100%", height: "100%" }} />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center", fontWeight: "600" }}>
            {title}
          </Text>
        </View>
      )}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 8,
          paddingVertical: 6,
          backgroundColor: "rgba(15,23,42,0.62)"
        }}
      >
        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }} numberOfLines={1}>
          {visibility === "PRIVATE" ? "🔒 " : ""}
          {title}
        </Text>
      </View>
    </Pressable>
  );
}
