import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Text,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GroupId } from "@eof/shared";
import { AlbumGridTile } from "../../components/album-grid-tile";
import { ImageLightbox } from "../../components/image-lightbox";
import { ProfileHero } from "../../components/profile-hero";
import { ProfileSocialLinks, profileLinksFromData } from "../../components/profile-social-links";
import {
  Card,
  EmptyState,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle,
  StarRatingPicker
} from "../../components/ui";
import { listUserAlbums, mediaUrl } from "../../services/albums.service";
import { startDirectThread } from "../../services/chat.service";
import { getProfile, rateTalent } from "../../services/profile.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { DiscoverStackParamList } from "../../navigation/types";
import type { AdminReportsStackParamList } from "../../navigation/types";
import type { AdminUsersStackParamList } from "../../navigation/types";
import type { PostJobStackParamList } from "../../navigation/types";
import type { ChatStackParamList } from "../../navigation/types";
import type { MemberFlowParamList } from "../../navigation/types";

type Props =
  | NativeStackScreenProps<DiscoverStackParamList, "MemberProfile">
  | NativeStackScreenProps<AdminReportsStackParamList, "MemberProfile">
  | NativeStackScreenProps<AdminUsersStackParamList, "MemberProfile">
  | NativeStackScreenProps<PostJobStackParamList, "MemberProfile">
  | NativeStackScreenProps<ChatStackParamList, "MemberProfile">;

type MemberFlowNavigation = NativeStackNavigationProp<MemberFlowParamList>;

function openMemberAlbum(
  navigation: Props["navigation"],
  params: MemberFlowParamList["MemberAlbum"]
) {
  (navigation as MemberFlowNavigation).navigate("MemberAlbum", params);
}

const GRID = 3;
const GAP = 2;
const TILE = Math.floor((Dimensions.get("window").width - 40 - GAP * (GRID - 1)) / GRID);

export function MemberProfileScreen({ route, navigation }: Props) {
  const userId = route.params.userId;
  const { accessToken, user } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [messagingBusy, setMessagingBusy] = useState(false);

  const isEmployer = (user?.roles ?? []).includes(GroupId.TalentEmployerOrAgency);
  const isSelf = user?.id === userId;

  const load = async () => {
    if (!accessToken || !userId) return;
    try {
      const [p, a] = await Promise.all([
        getProfile(userId, accessToken),
        listUserAlbums(accessToken, userId).catch(() => [])
      ]);
      setProfile(p);
      setAlbums(Array.isArray(a) ? a : []);
      const existing = (p as any).myRating;
      if (typeof existing === "number" && existing >= 1 && existing <= 5) {
        setSelectedRating(existing);
      }
    } catch (error) {
      Alert.alert("Could not load profile", (error as Error).message);
      navigation.goBack();
    }
  };

  const onSubmitRating = async () => {
    if (!accessToken || !selectedRating) {
      Alert.alert("Pick a rating", "Select 1 to 5 stars for this talent.");
      return;
    }
    try {
      setRatingBusy(true);
      const updated = (await rateTalent(accessToken, userId, {
        ratingValue: selectedRating
      })) as any;
      setProfile((prev: any) =>
        prev
          ? {
              ...prev,
              ratingAverage: updated.ratingAverage,
              ratingCount: updated.ratingCount,
              myRating: selectedRating
            }
          : prev
      );
      Alert.alert(
        "Rating saved",
        `You rated ${profile?.fullName || "this talent"} ${selectedRating}/5.`
      );
    } catch (error) {
      Alert.alert("Rating failed", (error as Error).message);
    } finally {
      setRatingBusy(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [accessToken, userId])
  );

  const avatarUri = mediaUrl(profile?.profilePhotoUrl) || null;
  const avatarKey = profile?.profilePhotoObjectKey || null;
  const tagTitles = ((profile?.profileTags ?? []) as any[])
    .filter((t) => t.isActive !== false)
    .map((t) => t.tag?.title)
    .filter(Boolean);
  const isOrg = Boolean(profile?.profileOrg);

  const onMessage = async () => {
    if (!accessToken || isSelf) return;
    try {
      setMessagingBusy(true);
      const thread = (await startDirectThread(accessToken, userId)) as any;
      navigation.getParent()?.navigate("Chat", {
        screen: "ChatConversation",
        params: {
          threadId: thread.id,
          recipientName: profile?.fullName || "Chat",
          recipientUserId: userId,
          recipientPhotoUrl: avatarUri,
          recipientPhotoObjectKey: avatarKey
        }
      });
    } catch (error) {
      Alert.alert("Message failed", (error as Error).message);
    } finally {
      setMessagingBusy(false);
    }
  };

  const openPreview = (uri: string | null, key?: string | null) => {
    if (!uri) return;
    setPreviewUri(uri);
    setPreviewKey(key || null);
  };

  if (!profile) {
    return (
      <ScreenLayout title="Profile" subtitle="Loading...">
        <EmptyState message="Loading profile..." />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={profile.fullName || "Talent profile"}
      subtitle={
        isOrg
          ? profile.profileOrg?.legalName || "Employer / Agency"
          : "Talent portfolio"
      }
      footer={
        <View style={{ width: "100%", gap: 10 }}>
          {!isSelf && !isOrg ? (
            <PrimaryButton
              title={messagingBusy ? "Opening chat..." : "Send message"}
              onPress={onMessage}
              loading={messagingBusy}
              disabled={messagingBusy}
            />
          ) : null}
          <SecondaryButton title="Back" onPress={() => navigation.goBack()} />
        </View>
      }
    >
      <ProfileHero
        name={profile.fullName}
        subtitle={
          [profile.city, profile.country].filter(Boolean).join(", ") || "Location not set"
        }
        avatarUri={avatarUri}
        avatarKey={avatarKey}
        onAvatarPress={() => openPreview(avatarUri, avatarKey)}
        meta={
          !isOrg
            ? `★ ${Number(profile.ratingAverage ?? 0).toFixed(1)}/5${
                profile.ratingCount ? ` (${profile.ratingCount})` : ""
              } · ${profile.isAvailable === false ? "Not looking" : "Looking for work"}`
            : profile.profileOrg?.legalName
        }
        tags={tagTitles.slice(0, 8)}
        bio={profile.miniBio}
      />

      <ProfileSocialLinks links={profileLinksFromData(profile)} />

      {isEmployer && !isOrg ? (
        <Card>
          <SectionTitle title="Rate this talent" />
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>
            Only employers and agencies can rate talent (1–5/5). You can update your rating anytime.
          </Text>
          <StarRatingPicker value={selectedRating} onChange={setSelectedRating} />
          {selectedRating ? (
            <Text style={{ color: colors.text, fontSize: 14, textAlign: "center", marginVertical: 10 }}>
              Your rating: {selectedRating}/5
            </Text>
          ) : null}
          <PrimaryButton
            title={profile.myRating ? "Update rating" : "Submit rating"}
            onPress={onSubmitRating}
            loading={ratingBusy}
            disabled={ratingBusy || !selectedRating}
          />
        </Card>
      ) : null}

      {!isOrg ? (
        <>
          <SectionTitle title="Albums" />
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>
            Public portfolio · tap an album to view photos & videos
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP + 2, justifyContent: "center" }}>
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
                  onPress={() =>
                    openMemberAlbum(navigation, {
                      albumId: album.id,
                      ownerName: profile.fullName
                    })
                  }
                  style={{ width: TILE, height: TILE }}
                />
              );
            })}
          </View>

          {albums.length === 0 ? (
            <EmptyState message="No public albums to show yet." />
          ) : null}
        </>
      ) : (
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>
          This is an employer / agency account.
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
