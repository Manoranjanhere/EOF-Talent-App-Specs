import React from "react";
import { Image, ImageContentFit, ImageStyle } from "expo-image";
import { StyleProp, ViewStyle } from "react-native";

/**
 * Disk+memory cached remote image. Prefer passing `cacheKey` as the S3 object key
 * so reloads stay fast even when signed query params change.
 */
export function CachedMediaImage({
  uri,
  cacheKey,
  style,
  contentFit = "cover",
  recyclingKey
}: {
  uri: string | null | undefined;
  cacheKey?: string | null;
  style?: StyleProp<ImageStyle | ViewStyle>;
  contentFit?: ImageContentFit;
  recyclingKey?: string;
}) {
  if (!uri) return null;

  const key = cacheKey || uri.split("?")[0];

  return (
    <Image
      source={{ uri, cacheKey: key }}
      style={style as StyleProp<ImageStyle>}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={120}
      recyclingKey={recyclingKey || key}
    />
  );
}
