import React from "react";
import { Text, View } from "react-native";
import { GroupId } from "@eof/shared";
import {
  Card,
  DangerButton,
  ScreenLayout,
  SectionTitle,
  StatPill
} from "../../components/ui";
import { ThemeToggleButton } from "../../components/theme-toggle-button";
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

export function DashboardScreen() {
  const auth = useAuth();
  const { colors } = useTheme();
  const roles = auth.user?.roles ?? [];

  const isTalent = roles.includes(GroupId.Talent);
  const isEmployer = roles.includes(GroupId.TalentEmployerOrAgency);

  return (
    <ScreenLayout
      title={`Hi, ${auth.user?.fullName ?? "there"}`}
      subtitle="Your talent marketplace hub"
      headerRight={<ThemeToggleButton />}
    >
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
