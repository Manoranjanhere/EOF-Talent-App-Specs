import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Text,
  View
} from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { GroupId } from "@eof/shared";
import { AlbumGridTile } from "../../components/album-grid-tile";
import { ImageLightbox } from "../../components/image-lightbox";
import { ProfileHero } from "../../components/profile-hero";
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
const GAP = 8;
const H_PAD = 20;
const TILE = Math.floor((Dimensions.get("window").width - H_PAD * 2 - GAP * (GRID - 1)) / GRID);

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
      <ProfileHero
        name={profile?.fullName || user?.fullName || "Member"}
        subtitle={[profile?.city, profile?.country].filter(Boolean).join(", ") || undefined}
        avatarUri={avatarUri}
        avatarKey={avatarKey}
        onAvatarPress={() => openPreview(avatarUri, avatarKey)}
        meta={
          isTalent
            ? `★ ${Number(profile?.ratingAverage ?? 0).toFixed(1)}/5 · ${
                profile?.isAvailable === false ? "Not looking" : "Looking for work"
              }`
            : isEmployer
              ? profile?.profileOrg?.legalName || "Employer / Agency"
              : undefined
        }
        tags={tagTitles.slice(0, 8)}
        bio={profile?.miniBio}
      />

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

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: GAP,
              justifyContent: "flex-start",
              width: "100%"
            }}
          >
            {albums.map((album) => {
              const coverAsset = album.assets?.[0];
              const cover = mediaUrl(
                coverAsset?.thumbnailUrl || coverAsset?.url || coverAsset?.objectKey
              );
              const coverKey = (coverAsset?.thumbnailObjectKey ||
                coverAsset?.objectKey) as string | undefined;
              return (
                <AlbumGridTile
                  key={album.id}
                  title={album.title}
                  coverUri={cover}
                  coverKey={coverKey}
                  visibility={album.visibility}
                  onPress={() => navigation.navigate("AlbumDetail", { albumId: album.id })}
                  onLongPress={() => openPreview(cover, coverKey)}
                  style={{ width: TILE, height: TILE }}
                />
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
