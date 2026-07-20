import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  Text,
  View
} from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { GroupId } from "@eof/shared";
import { CachedMediaImage } from "../../components/cached-media-image";
import { ImageLightbox } from "../../components/image-lightbox";
import {
  EmptyState,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle
} from "../../components/ui";
import { ThemeToggleButton } from "../../components/theme-toggle-button";
import { listMyAlbums, mediaUrl } from "../../services/albums.service";
import { getProfile } from "../../services/profile.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

const GRID = 3;
const GAP = 2;
const TILE = Math.floor((Dimensions.get("window").width - 40 - GAP * (GRID - 1)) / GRID);

export function ProfileHubScreen({ navigation }: { navigation: any }) {
  const route = useRoute<any>();
  const { accessToken, user, signOut } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const isEmployer = (user?.roles ?? []).includes(GroupId.TalentEmployerOrAgency);
  const isTalent = (user?.roles ?? []).includes(GroupId.Talent);

  const load = async () => {
    if (!accessToken || !user?.id) return;
    try {
      const p = await getProfile(user.id, accessToken);
      setProfile(p);
      if ((user.roles ?? []).includes(GroupId.Talent)) {
        const a = await listMyAlbums(accessToken);
        setAlbums(a as any[]);
      } else {
        setAlbums([]);
      }
    } catch (error) {
      Alert.alert("Could not load profile", (error as Error).message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load().then(() => {
        if (route.params?.profileUpdated) {
          Alert.alert("Profile updated", "Your changes have been saved.");
          navigation.setParams({ profileUpdated: undefined });
        }
      });
    }, [accessToken, user?.id, route.params?.profileUpdated])
  );

  const avatarUri = mediaUrl(profile?.profilePhotoUrl) || null;
  const avatarKey = profile?.profilePhotoObjectKey || null;

  const tagTitles = ((profile?.profileTags ?? []) as any[])
    .filter((t) => t.isActive !== false)
    .map((t) => t.tag?.title)
    .filter(Boolean);

  const openPreview = (uri: string | null, key?: string | null) => {
    if (!uri) return;
    setPreviewUri(uri);
    setPreviewKey(key || null);
  };

  return (
    <ScreenLayout
      title={profile?.fullName || user?.fullName || "My profile"}
      subtitle={
        isEmployer
          ? profile?.profileOrg?.legalName || "Employer / Agency"
          : "Talent profile"
      }
      headerRight={<ThemeToggleButton />}
      footer={
        <SecondaryButton title="Sign out" onPress={signOut} />
      }
    >
      <View style={{ alignItems: "center", marginBottom: 16, gap: 10 }}>
        <Pressable
          onPress={() => openPreview(avatarUri, avatarKey)}
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            overflow: "hidden",
            backgroundColor: colors.inset,
            borderWidth: 2,
            borderColor: colors.border
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
              <Text style={{ color: colors.muted, fontSize: 28 }}>
                {(profile?.fullName || user?.fullName || "?").slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>
        {avatarUri ? (
          <Text style={{ color: colors.muted, fontSize: 12 }}>Tap photo to enlarge</Text>
        ) : null}
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
          {profile?.fullName || user?.fullName}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>
          {[profile?.city, profile?.country].filter(Boolean).join(", ") || "Add your city"}
        </Text>
        {isTalent ? (
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            ★ {Number(profile?.ratingAverage ?? 0).toFixed(1)}/5 ·{" "}
            {profile?.isAvailable === false ? "Not looking" : "Looking for work"}
          </Text>
        ) : null}
        {tagTitles.length ? (
          <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>
            {tagTitles.slice(0, 6).join(" · ")}
          </Text>
        ) : null}
        {profile?.miniBio ? (
          <Text style={{ color: colors.text, fontSize: 14, textAlign: "center" }}>
            {profile.miniBio}
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            title={isEmployer && !isTalent ? "Edit company" : "Edit profile"}
            onPress={() =>
              navigation.navigate(isEmployer && !isTalent ? "EditOrgProfile" : "EditTalentProfile")
            }
          />
        </View>
        {isEmployer && isTalent ? (
          <View style={{ flex: 1 }}>
            <SecondaryButton
              title="Edit company"
              onPress={() => navigation.navigate("EditOrgProfile")}
            />
          </View>
        ) : null}
      </View>

      {isTalent ? (
        <>
          <SectionTitle title="Albums" />
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>
            Up to 5 albums · 9 photos + 1 video each · public or private
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
            {albums.map((album) => {
              const coverAsset = album.assets?.[0];
              const cover = mediaUrl(
                coverAsset?.thumbnailUrl || coverAsset?.url || coverAsset?.objectKey
              );
              const coverKey = (coverAsset?.thumbnailObjectKey ||
                coverAsset?.objectKey) as string | undefined;
              return (
                <Pressable
                  key={album.id}
                  onPress={() => navigation.navigate("AlbumDetail", { albumId: album.id })}
                  onLongPress={() => openPreview(cover, coverKey)}
                  style={{
                    width: TILE,
                    height: TILE,
                    backgroundColor: colors.inset,
                    borderRadius: 4,
                    overflow: "hidden"
                  }}
                >
                  {cover ? (
                    <CachedMediaImage
                      uri={cover}
                      cacheKey={coverKey}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 6
                      }}
                    >
                      <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center" }}>
                        {album.title}
                      </Text>
                    </View>
                  )}
                  <View
                    style={{
                      position: "absolute",
                      left: 4,
                      right: 4,
                      bottom: 4,
                      backgroundColor: "rgba(0,0,0,0.45)",
                      borderRadius: 4,
                      paddingHorizontal: 4,
                      paddingVertical: 2
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 10 }} numberOfLines={1}>
                      {album.visibility === "PRIVATE" ? "🔒 " : ""}
                      {album.title}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {albums.length === 0 ? (
            <EmptyState message="No albums yet. Create one to showcase your work." />
          ) : null}

          <View style={{ marginTop: 12 }}>
            <SecondaryButton
              title="Manage albums"
              onPress={() => navigation.navigate("AlbumsManage")}
            />
          </View>
        </>
      ) : (
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>
          Company accounts manage jobs and discover talent — albums are for talent portfolios.
        </Text>
      )}

      <ImageLightbox
        uri={previewUri}
        cacheKey={previewKey}
        visible={Boolean(previewUri)}
        onClose={() => {
          setPreviewUri(null);
          setPreviewKey(null);
        }}
      />
    </ScreenLayout>
  );
}
