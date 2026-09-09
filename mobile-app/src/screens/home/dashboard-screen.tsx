import { useCallback, useState, type ReactNode } from "react";
import { Alert, Pressable, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { GroupId } from "@eof/shared";
import {
  Card,
  DangerButton,
  PrimaryButton,
  ScreenLayout,
  SectionTitle
} from "../../components/ui";
import { AppText } from "../../components/app-text";
import { ThemeToggleButton } from "../../components/theme-toggle-button";
import { ChatUserAvatar } from "../../components/chat-user-avatar";
import {
  ChatIcon,
  DiscoverIcon,
  HelpIcon,
  JobsIcon,
  PostJobIcon,
  ProfileIcon
} from "../../components/icons";
import {
  acknowledgeWarning,
  listMyWarnings,
  type AdminWarningNotice
} from "../../services/moderation-notices.service";
import { getProfile, type PublicProfile } from "../../services/profile.service";
import { useAuth } from "../../state/auth-context";
import { fonts } from "../../theme/typography";
import { useTheme } from "../../theme/theme-context";

function roleLabel(groupId: number) {
  if (groupId === GroupId.Talent) return "Talent";
  if (groupId === GroupId.TalentEmployerOrAgency) return "Employer / Agency";
  if (groupId === GroupId.Admin) return "Admin";
  if (groupId === GroupId.TeamAdmin) return "Team Admin";
  if (groupId === GroupId.SuperAdmin) return "Super Admin";
  return `Role ${groupId}`;
}

function formatWarningDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function DestinationTile({
  label,
  title,
  icon,
  onPress
}: {
  label: string;
  title: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: "46%",
        backgroundColor: colors.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        minHeight: 118,
        opacity: pressed ? 0.92 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }]
      })}
    >
      <View style={{ height: 3, backgroundColor: colors.gold, borderRadius: 2, marginBottom: 14, width: 28 }} />
      {icon}
      <AppText variant="label" style={{ color: colors.muted, marginTop: 12 }}>
        {label}
      </AppText>
      <AppText
        style={{
          color: colors.text,
          fontFamily: fonts.serifBold,
          fontSize: 22,
          lineHeight: 26,
          marginTop: 2,
          fontWeight: "700"
        }}
      >
        {title}
      </AppText>
    </Pressable>
  );
}

export function DashboardScreen() {
  const auth = useAuth();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const roles = auth.user?.roles ?? [];
  const [warnings, setWarnings] = useState<AdminWarningNotice[]>([]);
  const [ackingId, setAckingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);

  const isTalent = roles.includes(GroupId.Talent);
  const isEmployer = roles.includes(GroupId.TalentEmployerOrAgency);
  const firstName = auth.user?.fullName?.split(" ")[0] ?? "there";

  const load = useCallback(async () => {
    if (!auth.accessToken) return;
    try {
      const [list, me] = await Promise.all([
        listMyWarnings(auth.accessToken),
        getProfile(auth.user?.id ?? "", auth.accessToken).catch(() => null)
      ]);
      setWarnings(Array.isArray(list) ? list : []);
      if (me) setProfile(me);
    } catch {
      // Home still works if notices fail
    }
  }, [auth.accessToken, auth.user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onAcknowledge = async (warning: AdminWarningNotice) => {
    if (!auth.accessToken) return;
    try {
      setAckingId(warning.id);
      await acknowledgeWarning(auth.accessToken, warning.id);
      setWarnings((prev) => prev.filter((w) => w.id !== warning.id));
    } catch (error) {
      Alert.alert("Could not dismiss", (error as Error).message);
    } finally {
      setAckingId(null);
    }
  };

  return (
    <ScreenLayout
      title={`Good day, ${firstName}`}
      subtitle="Your stage is live."
      headerRight={<ThemeToggleButton />}
    >
      {warnings.map((warning) => (
        <Card
          key={warning.id}
          style={{
            borderColor: colors.warning,
            backgroundColor: isDark ? colors.goldSoft : "#FFFBEB"
          }}
        >
          <SectionTitle title="Official warning" />
          <AppText style={{ color: colors.text, fontFamily: fonts.sansSemi }}>
            An administrator sent you a warning.
          </AppText>
          <AppText style={{ color: colors.text, marginTop: 6 }}>
            {warning.notes?.trim() ||
              "Please follow community guidelines. Further violations may lead to suspension or a block."}
          </AppText>
          <AppText variant="caption" style={{ color: colors.muted, marginTop: 8 }}>
            {formatWarningDate(warning.createdAt)}
          </AppText>
          <PrimaryButton
            title={ackingId === warning.id ? "Dismissing..." : "I understand"}
            onPress={() => void onAcknowledge(warning)}
            disabled={ackingId === warning.id}
            loading={ackingId === warning.id}
          />
        </Card>
      ))}

      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <ChatUserAvatar
            name={auth.user?.fullName || "You"}
            uri={profile?.profilePhotoUrl}
            cacheKey={profile?.profilePhotoObjectKey}
            size={64}
          />
          <View style={{ flex: 1 }}>
            <AppText variant="label" style={{ color: colors.muted }}>
              On set
            </AppText>
            <AppText variant="title" style={{ color: colors.text, fontSize: 26, lineHeight: 30 }}>
              {auth.user?.fullName}
            </AppText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {roles.map((r) => (
                <View
                  key={r}
                  style={{
                    backgroundColor: colors.goldSoft,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.gold
                  }}
                >
                  <AppText variant="label" style={{ color: colors.goldText, fontSize: 10 }}>
                    {roleLabel(r)}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {isEmployer || isTalent ? (
          <DestinationTile
            label="Cast"
            title="Discover"
            icon={<DiscoverIcon color={colors.primary} size={24} />}
            onPress={() => navigation.navigate("Discover")}
          />
        ) : null}
        {isTalent ? (
          <DestinationTile
            label="Work"
            title="Jobs"
            icon={<JobsIcon color={colors.primary} size={24} />}
            onPress={() => navigation.navigate("Jobs")}
          />
        ) : null}
        {isEmployer ? (
          <DestinationTile
            label="Hire"
            title="Post a job"
            icon={<PostJobIcon color={colors.primary} size={24} />}
            onPress={() => navigation.navigate("PostJob")}
          />
        ) : null}
        <DestinationTile
          label="Inbox"
          title="Chat"
          icon={<ChatIcon color={colors.primary} size={24} />}
          onPress={() => navigation.navigate("Chat")}
        />
        <DestinationTile
          label="You"
          title="Profile"
          icon={<ProfileIcon color={colors.primary} size={24} />}
          onPress={() => navigation.navigate("Profile")}
        />
        <DestinationTile
          label="Support"
          title="Help"
          icon={<HelpIcon color={colors.primary} size={24} />}
          onPress={() => navigation.navigate("Help")}
        />
      </View>

      <DangerButton title="Sign out" onPress={auth.signOut} />
    </ScreenLayout>
  );
}
