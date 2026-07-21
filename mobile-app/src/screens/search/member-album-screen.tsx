import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  Text,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CachedMediaImage } from "../../components/cached-media-image";
import { MediaLightbox, MediaPreview } from "../../components/media-lightbox";
import {
  Card,
  EmptyState,
  ScreenLayout,
  SecondaryButton,
  SectionTitle
} from "../../components/ui";
import { getAlbumAsViewer, mediaUrl } from "../../services/albums.service";
import { generateVideoThumbnail } from "../../services/video-thumbnail";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import type {
  AdminReportsStackParamList,
  AdminUsersStackParamList,
  ChatStackParamList,
  DiscoverStackParamList,
  PostJobStackParamList
} from "../../navigation/types";

type Props =
  | NativeStackScreenProps<DiscoverStackParamList, "MemberAlbum">
  | NativeStackScreenProps<AdminReportsStackParamList, "MemberAlbum">
  | NativeStackScreenProps<AdminUsersStackParamList, "MemberAlbum">
  | NativeStackScreenProps<PostJobStackParamList, "MemberAlbum">
  | NativeStackScreenProps<ChatStackParamList, "MemberAlbum">;

const SCREEN_W = Dimensions.get("window").width;
const MEDIA_GAP = 8;
const MEDIA_TILE = Math.floor((SCREEN_W - 40 - 32 - MEDIA_GAP - 32) / 2);

export function MemberAlbumScreen({ route, navigation }: Props) {
  const { albumId, ownerName } = route.params;
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [album, setAlbum] = useState<any>(null);
  const [preview, setPreview] = useState<MediaPreview | null>(null);
  const [localVideoThumbs, setLocalVideoThumbs] = useState<Record<string, string>>({});

  const tileStyle = useMemo(
    () => ({
      width: MEDIA_TILE,
      height: MEDIA_TILE,
      borderRadius: 10,
      overflow: "hidden" as const,
      backgroundColor: colors.inset
    }),
    [colors.inset]
  );

  const load = async () => {
    if (!accessToken) return;
    try {
      setAlbum(await getAlbumAsViewer(accessToken, albumId));
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
      navigation.goBack();
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [accessToken, albumId])
  );

  useEffect(() => {
    const assets = (album?.assets ?? []) as any[];
    assets
      .filter((a) => a.assetType === "VIDEO" && !a.thumbnailUrl && !localVideoThumbs[a.id])
      .forEach((asset) => {
        const videoUri = mediaUrl(asset.url || asset.objectKey);
        if (!videoUri) return;
        void generateVideoThumbnail(videoUri).then((thumb) => {
          if (thumb) {
            setLocalVideoThumbs((prev) => ({ ...prev, [asset.id]: thumb }));
          }
        });
      });
  }, [album?.assets]);

  if (!album) {
    return (
      <ScreenLayout title="Album" subtitle="Loading...">
        <EmptyState message="Loading album..." />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={album.title}
      subtitle={
        ownerName
          ? `${ownerName} · ${(album.assets ?? []).length} media`
          : `${album.visibility} · ${(album.assets ?? []).length} media`
      }
      footer={<SecondaryButton title="Back" onPress={() => navigation.goBack()} />}
    >
      <Card>
        <SectionTitle title="Media" />
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: MEDIA_GAP,
            justifyContent: "center"
          }}
        >
          {(album.assets ?? []).map((asset: any) => {
            const isVideo = asset.assetType === "VIDEO";
            const thumbUri =
              mediaUrl(asset.thumbnailUrl) ||
              localVideoThumbs[asset.id] ||
              (!isVideo ? mediaUrl(asset.url || asset.objectKey) : null);
            const fullUri = mediaUrl(asset.url || asset.objectKey);
            return (
              <View key={asset.id} style={tileStyle}>
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (!fullUri && !thumbUri) return;
                    if (isVideo && fullUri) {
                      setPreview({
                        uri: fullUri,
                        cacheKey: asset.objectKey,
                        type: "video"
                      });
                      return;
                    }
                    if (fullUri) {
                      setPreview({
                        uri: fullUri,
                        cacheKey: asset.objectKey,
                        type: "image"
                      });
                    }
                  }}
                >
                  {thumbUri ? (
                    <CachedMediaImage
                      uri={thumbUri}
                      cacheKey={
                        asset.thumbnailObjectKey ||
                        (isVideo ? `video-thumb-${asset.id}` : asset.objectKey)
                      }
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      {isVideo ? (
                        <ActivityIndicator color={colors.muted} />
                      ) : (
                        <Text style={{ color: colors.muted, fontSize: 11 }}>…</Text>
                      )}
                    </View>
                  )}
                  {isVideo ? (
                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: "rgba(0,0,0,0.55)",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 14, marginLeft: 2 }}>▶</Text>
                      </View>
                    </View>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
        {(album.assets ?? []).length === 0 ? (
          <EmptyState message="No photos/videos in this album yet." />
        ) : null}
      </Card>

      <MediaLightbox
        media={preview}
        visible={Boolean(preview)}
        onClose={() => setPreview(null)}
      />
    </ScreenLayout>
  );
}
