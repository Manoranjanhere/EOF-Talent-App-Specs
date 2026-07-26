import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { GroupId } from "@eof/shared";
import {
  Card,
  DangerButton,
  PrimaryButton,
  ScreenLayout,
  SectionTitle,
  StatPill
} from "../../components/ui";
import { ThemeToggleButton } from "../../components/theme-toggle-button";
import {
  acknowledgeWarning,
  listMyWarnings,
  type AdminWarningNotice
} from "../../services/moderation-notices.service";
import { useAuth } from "../../state/auth-context";
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

export function DashboardScreen() {
  const auth = useAuth();
  const { colors, isDark } = useTheme();
  const roles = auth.user?.roles ?? [];
  const [warnings, setWarnings] = useState<AdminWarningNotice[]>([]);
  const [ackingId, setAckingId] = useState<string | null>(null);

  const isTalent = roles.includes(GroupId.Talent);
  const isEmployer = roles.includes(GroupId.TalentEmployerOrAgency);

  const loadWarnings = useCallback(async () => {
    if (!auth.accessToken) return;
    try {
      const list = await listMyWarnings(auth.accessToken);
      setWarnings(Array.isArray(list) ? list : []);
    } catch {
      // Non-blocking — home still works if notices fail
    }
  }, [auth.accessToken]);

  useFocusEffect(
    useCallback(() => {
      void loadWarnings();
    }, [loadWarnings])
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
      title={`Hi, ${auth.user?.fullName ?? "there"}`}
      subtitle="Your talent marketplace hub"
      headerRight={<ThemeToggleButton />}
    >
      {warnings.map((warning) => (
        <Card
          key={warning.id}
          style={{
            borderColor: "#F59E0B",
            backgroundColor: isDark ? "#3B2F14" : "#FFFBEB"
          }}
        >
          <SectionTitle title="Official warning" />
          <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: "600" }}>
            An administrator sent you a warning.
          </Text>
          <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 6 }}>
            {warning.notes?.trim() ||
              "Please follow community guidelines. Further violations may lead to suspension or a block."}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 8 }}>
            {formatWarningDate(warning.createdAt)}
          </Text>
          <PrimaryButton
            title={ackingId === warning.id ? "Dismissing..." : "I understand"}
            onPress={() => void onAcknowledge(warning)}
            disabled={ackingId === warning.id}
            loading={ackingId === warning.id}
          />
        </Card>
      ))}

      <Card>
        <SectionTitle title="Account" />
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          Signed in as{" "}
          <Text style={{ color: colors.text, fontWeight: "700" }}>{auth.user?.fullName}</Text>
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {roles.map((r) => (
            <View
              key={r}
              style={{
                backgroundColor: colors.primarySoft,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border
              }}
            >
              <Text style={{ color: colors.accentText, fontSize: 12, fontWeight: "600" }}>
                {roleLabel(r)}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {isEmployer ? <StatPill label="Discover" value="Talent" /> : null}
        {isTalent ? <StatPill label="Jobs" value="Board" /> : null}
        <StatPill label="Chat" value="Inbox" />
        <StatPill label="Help" value="Q&A" />
      </View>

      <Card>
        <SectionTitle title="Quick start" />
        <Text style={{ color: colors.muted, lineHeight: 22, fontSize: 14 }}>
          {isTalent
            ? "• Complete your profile and add a photo\n• Browse jobs and apply with one tap\n• Message employers for free"
            : isEmployer
              ? "• Post jobs (₹300 per listing, 90 days)\n• Discover talent and view portfolios\n• Message talent after subscribing (₹300/mo)"
              : "• Use Reports and Users tabs to moderate\n• Feedback from members arrives in your Chat inbox"}
        </Text>
      </Card>

      <DangerButton title="Sign out" onPress={auth.signOut} />
    </ScreenLayout>
  );
}
