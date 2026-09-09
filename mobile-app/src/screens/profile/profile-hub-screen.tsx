import { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Share,
  Text,
  View
} from "react-native";
import { useFocusEffect, useRoute, type RouteProp } from "@react-navigation/native";
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
  SectionTitle
} from "../../components/ui";
import { ThemeToggleButton } from "../../components/theme-toggle-button";
import { listMyAlbums, mediaUrl, type AlbumSummary } from "../../services/albums.service";
import { getProfile, type PublicProfile } from "../../services/profile.service";
import {
  listSubscriptionPlans,
  purchasePlanWithPlayStore,
  talentSeriousPlanCode
} from "../../services/subscriptions.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import type { ProfileStackParamList } from "../../navigation/types";

const GRID = 3;
const GAP = 8;
const H_PAD = 20;
const TILE = Math.floor((Dimensions.get("window").width - H_PAD * 2 - GAP * (GRID - 1)) / GRID);

export function ProfileHubScreen({ navigation }: NativeStackScreenProps<ProfileStackParamList, "ProfileHub">) {
  const route = useRoute<RouteProp<ProfileStackParamList, "ProfileHub">>();
  const { accessToken, user, signOut } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [albums, setAlbums] = useState<AlbumSummary[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const isEmployer = (user?.roles ?? []).includes(GroupId.TalentEmployerOrAgency);
  const isTalent = (user?.roles ?? []).includes(GroupId.Talent);

  const load = async () => {
    if (!accessToken || !user?.id) return;
    try {
      const p = await getProfile(user.id, accessToken);
      setProfile(p);
      if ((user.roles ?? []).includes(GroupId.Talent)) {
        const a = await listMyAlbums(accessToken);
        setAlbums(Array.isArray(a) ? a : []);
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

  const tagTitles = (profile?.profileTags ?? [])
    .filter((t) => t.isActive !== false)
    .map((t) => t.tag?.title)
    .filter((title): title is string => Boolean(title));

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
          : "Your lookbook"
      }
      headerStyle="slim"
      showTitle={false}
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
        badge={profile?.seriousAboutJob ? "SERIOUS ABOUT JOB" : null}
      />

      <ProfileSocialLinks links={profileLinksFromData(profile ?? {})} />

      {isTalent ? (
        <Card>
          <SectionTitle title="Invite friends" />
          <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>
            When a friend joins as talent with your referral, you get Serious about job for 1 month.
          </Text>
          <SecondaryButton
            title="Share referral"
            onPress={() =>
              void Share.share({
                message: `Join me on EOF Talent. Use my referral id: ${user?.id}`
              })
            }
          />
        </Card>
      ) : null}

      {isTalent && !profile?.seriousAboutJob ? (
        <Card>
          <SectionTitle title="Serious about job" />
          <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>
            ₹200/month includes messaging and a public Serious about job badge.
          </Text>
          <PrimaryButton
            title={purchasing ? "Purchasing..." : "Get Serious about job · ₹200"}
            onPress={async () => {
              if (!accessToken) return;
              try {
                setPurchasing(true);
                const plans = await listSubscriptionPlans();
                const plan = plans.find((p) => p.code === talentSeriousPlanCode());
                if (!plan) throw new Error("Plan not available");
                await purchasePlanWithPlayStore(accessToken, {
                  id: plan.id,
                  code: plan.code,
                  isJobPostingPlan: false
                });
                Alert.alert("Activated", "Serious about job is now on your profile.");
                await load();
              } catch (error) {
                Alert.alert("Purchase failed", (error as Error).message);
              } finally {
                setPurchasing(false);
              }
            }}
            loading={purchasing}
            disabled={purchasing}
          />
        </Card>
      ) : null}

      {profile?.employerStats ? (
        <Card>
          <SectionTitle title="Gig stats" />
          <Text style={{ color: colors.text, fontSize: 14 }}>
            Posted: {profile.employerStats.gigsPosted}
          </Text>
          <Text style={{ color: colors.text, fontSize: 14 }}>
            Completed: {profile.employerStats.gigsCompleted}
          </Text>
          <Text style={{ color: colors.text, fontSize: 14 }}>
            Average rating: {Number(profile.employerStats.avgRating ?? 0).toFixed(1)}/5
          </Text>
        </Card>
      ) : null}

      {(profile?.completedGigs ?? []).length > 0 ? (
        <Card>
          <SectionTitle title="Past gigs" />
          {(profile?.completedGigs ?? []).map((gig) => (
            <View key={gig.applicationId} style={{ marginBottom: 8 }}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>{gig.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                {gig.employerName} · {gig.rating != null ? `${gig.rating}/5` : "Not rated"}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16, marginTop: 12 }}>
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
