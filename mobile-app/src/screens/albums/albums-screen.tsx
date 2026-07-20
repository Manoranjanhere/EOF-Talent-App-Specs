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
import * as ImagePicker from "expo-image-picker";
import { CachedMediaImage } from "../../components/cached-media-image";
import { MediaLightbox, MediaPreview } from "../../components/media-lightbox";
import {
  Card,
  DangerButton,
  EmptyState,
  LabeledInput,
  ListCard,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle,
  SegmentedControl
} from "../../components/ui";
import {
  createAlbum,
  deleteAlbum,
  deleteAlbumAsset,
  getAlbum,
  grantAlbumAccess,
  listMyAlbums,
  mediaUrl,
  revokeAlbumAccess,
  uploadAlbumAsset
} from "../../services/albums.service";
import { generateVideoThumbnail } from "../../services/video-thumbnail";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

type PendingUpload = {
  id: string;
  uri: string;
  kind: "image" | "video";
  status: "uploading" | "done" | "error";
};

const SCREEN_W = Dimensions.get("window").width;
/** 2-column grid: scroll pad 20*2 + card pad 16*2 + gap 8 + 32 side inset */
const MEDIA_GAP = 8;
const MEDIA_TILE = Math.floor((SCREEN_W - 40 - 32 - MEDIA_GAP - 32) / 2);

export function AlbumsScreen({ navigation }: { navigation?: any }) {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [albums, setAlbums] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!accessToken) return;
    try {
      setAlbums((await listMyAlbums(accessToken)) as any[]);
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [accessToken])
  );

  const onCreateAlbum = async () => {
    if (!accessToken || !title.trim()) return;
    try {
      setCreating(true);
      const album = (await createAlbum(accessToken, {
        title: title.trim(),
        visibility
      })) as any;
      setTitle("");
      await load();
      navigation?.navigate?.("AlbumDetail", { albumId: album.id });
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const onDeleteAlbum = (album: { id: string; title: string }) => {
    if (!accessToken) return;
    Alert.alert("Delete album", `Delete “${album.title}” and all its media?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              setBusyId(album.id);
              await deleteAlbum(accessToken, album.id);
              await load();
            } catch (error) {
              Alert.alert("Delete failed", (error as Error).message);
            } finally {
              setBusyId(null);
            }
          })();
        }
      }
    ]);
  };

  return (
    <ScreenLayout
      title="Photo albums"
      subtitle="Max 5 albums · 10 items (9 photos + 1 video) · Public/Private"
    >
      <Card>
        <SectionTitle title="Create album" />
        <LabeledInput
          label="Album title"
          value={title}
          onChangeText={setTitle}
          placeholder="Portfolio 2026"
        />
        <SegmentedControl
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: "PUBLIC", label: "Public" },
            { value: "PRIVATE", label: "Private" }
          ]}
        />
        <PrimaryButton
          title={creating ? "Creating..." : "Create album"}
          onPress={onCreateAlbum}
          loading={creating}
          disabled={creating || albums.length >= 5}
        />
        {albums.length >= 5 ? (
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            You already have 5 albums (limit reached).
          </Text>
        ) : null}
      </Card>

      <SectionTitle title={`Your albums (${albums.length}/5)`} />
      {albums.length === 0 ? (
        <EmptyState message="No albums yet." />
      ) : (
        albums.map((album) => {
          const coverAsset = album.assets?.[0];
          const cover = mediaUrl(
            coverAsset?.thumbnailUrl || coverAsset?.url || coverAsset?.objectKey
          );
          return (
            <View key={album.id} style={{ marginBottom: 12, gap: 8 }}>
              <ListCard
                title={album.title}
                meta={[
                  album.visibility,
                  `${album._count?.assets ?? 0}/10 media`,
                  album.visibility === "PRIVATE"
                    ? `${album._count?.accessGrants ?? 0} access grants`
                    : "Visible to all"
                ]}
                badge={album.visibility}
                onPress={() => navigation?.navigate?.("AlbumDetail", { albumId: album.id })}
              />
              {cover ? (
                <CachedMediaImage
                  uri={cover}
                  cacheKey={coverAsset?.thumbnailObjectKey || coverAsset?.objectKey}
                  style={{ width: "100%", height: 140, borderRadius: 10 }}
                />
              ) : null}
              <DangerButton
                title={busyId === album.id ? "Deleting..." : "Delete album"}
                onPress={() => onDeleteAlbum(album)}
              />
            </View>
          );
        })
      )}
    </ScreenLayout>
  );
}

export function AlbumDetailScreen({
  route,
  navigation
}: {
  route: { params: { albumId: string } };
  navigation: any;
}) {
  const albumId = route.params.albumId;
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [album, setAlbum] = useState<any>(null);
  const [grantedTo, setGrantedTo] = useState("");
  const [grantDaysKey, setGrantDaysKey] = useState<"30" | "60" | "90">("30");
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(
    null
  );
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
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
      setAlbum(await getAlbum(accessToken, albumId));
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

  // Backfill thumbnails for older videos that have no stored thumbnail.
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

  const onAddMedia = async (kind: "image" | "video") => {
    if (!accessToken || !album || busy) return;

    const existing = (album.assets ?? []) as Array<{ assetType: string }>;
    const imageCount = existing.filter((a) => a.assetType === "IMAGE").length;
    const videoCount = existing.filter((a) => a.assetType === "VIDEO").length;
    const remainingTotal = Math.max(0, 10 - existing.length);
    const remainingImages = Math.max(0, Math.min(9 - imageCount, remainingTotal));

    if (kind === "image" && remainingImages <= 0) {
      Alert.alert(
        "Photo limit reached",
        "This album can hold up to 9 photos (plus 1 video, 10 total)."
      );
      return;
    }
    if (kind === "video") {
      if (videoCount >= 1) {
        Alert.alert("Video limit reached", "Only one video is allowed per album.");
        return;
      }
      if (remainingTotal <= 0) {
        Alert.alert("Album full", "This album already has 10 media items.");
        return;
      }
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow media library access to upload.");
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        kind === "video"
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: kind === "image",
      selectionLimit: kind === "image" ? remainingImages : 1
    });
    if (picked.canceled || !picked.assets?.length) return;

    const selected =
      kind === "image" ? picked.assets.slice(0, remainingImages) : picked.assets.slice(0, 1);

    const pending: PendingUpload[] = selected.map((asset, index) => ({
      id: `${Date.now()}-${index}`,
      uri: asset.uri,
      kind,
      status: "uploading"
    }));
    setPendingUploads(pending);
    setUploadProgress({ done: 0, total: selected.length });
    setBusy(true);

    let uploaded = 0;
    const failures: string[] = [];

    for (let i = 0; i < selected.length; i += 1) {
      const asset = selected[i];
      const pendingId = pending[i].id;
      const mimeType = asset.mimeType || (kind === "video" ? "video/mp4" : "image/jpeg");
      try {
        let thumbnailUri: string | null = null;
        if (kind === "video") {
          thumbnailUri = await generateVideoThumbnail(asset.uri);
        }
        await uploadAlbumAsset(accessToken, albumId, asset.uri, mimeType, {
          thumbnailUri
        });
        uploaded += 1;
        setPendingUploads((prev) =>
          prev.map((p) => (p.id === pendingId ? { ...p, status: "done" } : p))
        );
      } catch (error) {
        failures.push((error as Error).message);
        setPendingUploads((prev) =>
          prev.map((p) => (p.id === pendingId ? { ...p, status: "error" } : p))
        );
      }
      setUploadProgress({ done: i + 1, total: selected.length });
      // Brief pause between files so phone Wi‑Fi / USB reverse doesn't drop the connection.
      if (i < selected.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 450));
      }
    }

    await load();
    setPendingUploads([]);
    setUploadProgress(null);
    setBusy(false);

    if (failures.length && uploaded === 0) {
      Alert.alert("Upload failed", failures[0]);
    } else if (failures.length) {
      Alert.alert(
        "Partially uploaded",
        `${uploaded} uploaded, ${failures.length} failed. ${failures[0]}`
      );
    }
  };

  const onDeleteAsset = (assetId: string) => {
    if (!accessToken) return;
    Alert.alert("Delete media", "Remove this item from the album?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              setBusy(true);
              await deleteAlbumAsset(accessToken, albumId, assetId);
              await load();
            } catch (error) {
              Alert.alert("Delete failed", (error as Error).message);
            } finally {
              setBusy(false);
            }
          })();
        }
      }
    ]);
  };

  const onDeleteAlbum = () => {
    if (!accessToken) return;
    Alert.alert("Delete album", `Delete “${album?.title}” and all its media?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              setBusy(true);
              await deleteAlbum(accessToken, albumId);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Delete failed", (error as Error).message);
              setBusy(false);
            }
          })();
        }
      }
    ]);
  };

  const onGrant = async () => {
    if (!accessToken || !grantedTo.trim()) return;
    try {
      setBusy(true);
      await grantAlbumAccess(accessToken, albumId, {
        grantedToUserId: grantedTo.trim(),
        grantedDays: Number(grantDaysKey) as 30 | 60 | 90
      });
      setGrantedTo("");
      await load();
      Alert.alert("Access granted", "User can view this private album until expiry.");
    } catch (error) {
      Alert.alert("Grant failed", (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (grantId: string) => {
    if (!accessToken) return;
    try {
      await revokeAlbumAccess(accessToken, grantId);
      await load();
    } catch (error) {
      Alert.alert("Revoke failed", (error as Error).message);
    }
  };

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
      subtitle={`${album.visibility} · ${(album.assets ?? []).length}/10 media`}
      footer={
        <View style={{ width: "100%", gap: 10 }}>
          <DangerButton title="Delete album" onPress={onDeleteAlbum} />
          <SecondaryButton title="Back" onPress={() => navigation.goBack()} />
        </View>
      }
    >
      <Card>
        <SectionTitle title="Media" />
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              title="Add photos"
              onPress={() => onAddMedia("image")}
              disabled={busy}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              title="Add video"
              onPress={() => onAddMedia("video")}
              disabled={busy}
            />
          </View>
        </View>

        {uploadProgress ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
              padding: 10,
              borderRadius: 10,
              backgroundColor: colors.inset
            }}
          >
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600", flex: 1 }}>
              Uploading {uploadProgress.done}/{uploadProgress.total}…
            </Text>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: MEDIA_GAP,
            justifyContent: "center"
          }}
        >
          {pendingUploads.map((item) => (
            <View key={item.id} style={tileStyle}>
              <CachedMediaImage
                uri={item.uri}
                cacheKey={item.uri}
                style={{ width: "100%", height: "100%", opacity: 0.55 }}
              />
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.35)"
                }}
              >
                {item.status === "uploading" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                    {item.status === "done" ? "Done" : "Failed"}
                  </Text>
                )}
              </View>
              {item.kind === "video" ? (
                <View
                  style={{
                    position: "absolute",
                    left: 6,
                    bottom: 6,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    borderRadius: 4,
                    paddingHorizontal: 4,
                    paddingVertical: 2
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 10 }}>VIDEO</Text>
                </View>
              ) : null}
            </View>
          ))}

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
                <Pressable
                  onPress={() => onDeleteAsset(asset.id)}
                  disabled={busy}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: "rgba(0,0,0,0.65)",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>×</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
        {(album.assets ?? []).length === 0 && pendingUploads.length === 0 ? (
          <EmptyState message="No photos/videos in this album yet." />
        ) : null}
      </Card>

      {album.visibility === "PRIVATE" ? (
        <Card>
          <SectionTitle title="Private access" />
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
            Grant access to an agency/member for 30 (default), 60, or 90 days. Manage and revoke
            below.
          </Text>
          <LabeledInput
            label="User email / mobile / id"
            value={grantedTo}
            onChangeText={setGrantedTo}
            placeholder="agency@example.com or mobile"
            autoCapitalize="none"
          />
          <SegmentedControl
            value={grantDaysKey}
            onChange={setGrantDaysKey}
            options={[
              { value: "30", label: "30 days" },
              { value: "60", label: "60 days" },
              { value: "90", label: "90 days" }
            ]}
          />
          <PrimaryButton title="Grant access" onPress={onGrant} disabled={busy} loading={busy} />

          <SectionTitle title="Users with access" />
          {(album.accessGrants ?? []).length === 0 ? (
            <EmptyState message="No active access grants." />
          ) : (
            (album.accessGrants ?? []).map((grant: any) => (
              <View key={grant.id} style={{ marginBottom: 10, gap: 6 }}>
                <ListCard
                  title={grant.grantedToUser?.fullName ?? grant.grantedToUserId}
                  meta={[
                    grant.grantedToUser?.email || grant.grantedToUser?.mobileNumber || "",
                    `Expires ${new Date(grant.expiresAt).toLocaleDateString()}`,
                    `${grant.grantedDays} days`
                  ]}
                  badge="ACTIVE"
                />
                <Pressable onPress={() => onRevoke(grant.id)}>
                  <Text style={{ color: colors.danger, fontSize: 13 }}>Remove access</Text>
                </Pressable>
              </View>
            ))
          )}
        </Card>
      ) : (
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          This album is public. Switch to a private album to manage access grants.
        </Text>
      )}

      <MediaLightbox
        media={preview}
        visible={Boolean(preview)}
        onClose={() => setPreview(null)}
      />
    </ScreenLayout>
  );
}
