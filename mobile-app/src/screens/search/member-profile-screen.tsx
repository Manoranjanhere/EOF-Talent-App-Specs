import { useCallback, useState } from "react";
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
import { listUserAlbums, mediaUrl, type AlbumSummary } from "../../services/albums.service";
import { getMessagingStatus, startDirectThread } from "../../services/chat.service";
import { getProfile, rateTalent, type PublicProfile } from "../../services/profile.service";
import { AddToListPanel } from "../lists/add-to-list-panel";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { DiscoverStackParamList } from "../../navigation/types";
import type { AdminReportsStackParamList } from "../../navigation/types";
import type { AdminUsersStackParamList } from "../../navigation/types";
import type { PostJobStackParamList } from "../../navigation/types";
import type { ChatStackParamList } from "../../navigation/types";
import type { JobsStackParamList } from "../../navigation/types";
import type { MemberFlowParamList } from "../../navigation/types";

type Props =
  | NativeStackScreenProps<DiscoverStackParamList, "MemberProfile">
  | NativeStackScreenProps<AdminReportsStackParamList, "MemberProfile">
  | NativeStackScreenProps<AdminUsersStackParamList, "MemberProfile">
  | NativeStackScreenProps<PostJobStackParamList, "MemberProfile">
  | NativeStackScreenProps<ChatStackParamList, "MemberProfile">
  | NativeStackScreenProps<JobsStackParamList, "MemberProfile">;

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
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [albums, setAlbums] = useState<AlbumSummary[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [messagingBusy, setMessagingBusy] = useState(false);
  const [canMessageEmployers, setCanMessageEmployers] = useState(true);
  const [showAddToList, setShowAddToList] = useState(false);

  const isEmployer = (user?.roles ?? []).includes(GroupId.TalentEmployerOrAgency);
  const isTalent = (user?.roles ?? []).includes(GroupId.Talent);
  const isSelf = user?.id === userId;

  const load = async () => {
    if (!accessToken || !userId) return;
    try {
      const [p, a, status] = await Promise.all([
        getProfile(userId, accessToken),
        listUserAlbums(accessToken, userId).catch(() => []),
        getMessagingStatus(accessToken).catch(() => null)
      ]);
      setProfile(p);
      setAlbums(Array.isArray(a) ? a : []);
      setCanMessageEmployers(status?.canMessageEmployers !== false);
      const existing = p.myRating;
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
      Alert.alert("Pick a rating", "Select 1 to 5 stars.");
      return;
    }
    try {
      setRatingBusy(true);
      const updated = await rateTalent(accessToken, userId, {
        ratingValue: selectedRating
      });
      setProfile((prev) =>
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
        `You rated ${profile?.fullName || "this member"} ${selectedRating}/5.`
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
  const tagTitles = (profile?.profileTags ?? [])
    .filter((t) => t.isActive !== false)
    .map((t) => t.tag?.title)
    .filter((title): title is string => Boolean(title));
  const isOrg = Boolean(profile?.profileOrg);
  const isEmployerProfile =
    isOrg ||
    ((profile?.roles ?? []) as Array<{ groupId: number }>).some(
      (r) => r.groupId === GroupId.TalentEmployerOrAgency
    );
  const isTalentProfile = ((profile?.roles ?? []) as Array<{ groupId: number }>).some(
    (r) => r.groupId === GroupId.Talent
  );
  const canRate =
    !isSelf && ((isEmployer && isTalentProfile) || (isTalent && isEmployerProfile));
  const canSendMessage = !isSelf && (!isEmployerProfile || canMessageEmployers);
  const inDiscover = ((navigation.getState()?.routeNames as string[] | undefined) ?? []).includes(
    "PeopleLists"
  );

  const onMessage = async () => {
    if (!accessToken || isSelf) return;
    try {
      setMessagingBusy(true);
      const thread = await startDirectThread(accessToken, userId);
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
      <ScreenLayout title="Profile" subtitle="Loading..." headerStyle="slim">
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
      headerStyle="slim"
      showTitle={false}
      footer={
        <View style={{ width: "100%", gap: 10 }}>
          {canSendMessage ? (
            <PrimaryButton
              title={messagingBusy ? "Opening chat..." : "Send message"}
              onPress={onMessage}
              loading={messagingBusy}
              disabled={messagingBusy}
            />
          ) : !isSelf ? (
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>
              Messaging-only plan is talent-to-talent. Upgrade to Serious about job to message employers.
            </Text>
          ) : null}
          {!isSelf && accessToken && inDiscover ? (
            <SecondaryButton title="Add to list" onPress={() => setShowAddToList(true)} />
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
            : profile.profileOrg?.legalName ?? undefined
        }
        tags={tagTitles.slice(0, 8)}
        bio={profile.miniBio}
        badge={profile.seriousAboutJob ? "SERIOUS ABOUT JOB" : null}
      />

      <ProfileSocialLinks links={profileLinksFromData(profile)} />

      {showAddToList && accessToken && inDiscover ? (
        <AddToListPanel
          token={accessToken}
          memberUserId={userId}
          memberName={profile.fullName}
          onClose={() => setShowAddToList(false)}
        />
      ) : null}

      {profile.employerStats ? (
        <Card>
          <SectionTitle title="Employer stats" />
          <Text style={{ color: colors.text, fontSize: 14 }}>
            Gigs posted: {profile.employerStats.gigsPosted}
          </Text>
          <Text style={{ color: colors.text, fontSize: 14 }}>
            Gigs completed: {profile.employerStats.gigsCompleted}
          </Text>
          <Text style={{ color: colors.text, fontSize: 14 }}>
            Average rating: {Number(profile.employerStats.avgRating ?? 0).toFixed(1)}/5
          </Text>
        </Card>
      ) : null}

      {canRate ? (
        <Card>
          <SectionTitle title={isEmployerProfile ? "Rate this employer" : "Rate this talent"} />
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>
            1–5 stars. You can update your rating anytime.
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

      {(profile.completedGigs ?? []).length > 0 ? (
        <Card>
          <SectionTitle title="Past gigs" />
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
            Completed work only, with client ratings.
          </Text>
          {(profile.completedGigs ?? []).map((gig) => (
            <View key={gig.applicationId} style={{ marginBottom: 10 }}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>{gig.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                {gig.employerName}
                {gig.completedAt ? ` · ${new Date(gig.completedAt).toLocaleDateString()}` : ""}
              </Text>
              <Text style={{ color: colors.text, fontSize: 13 }}>
                Client rating: {gig.rating != null ? `${gig.rating}/5` : "Not rated"}
              </Text>
            </View>
          ))}
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
