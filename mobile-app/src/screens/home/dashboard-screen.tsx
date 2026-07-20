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

  return (
    <ScreenLayout
      title={`Hi, ${auth.user?.fullName ?? "there"}`}
      subtitle="Your talent marketplace hub"
      headerRight={<ThemeToggleButton />}
    >
      <Card>
        <SectionTitle title="Account" />
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          Signed in as <Text style={{ color: colors.text, fontWeight: "700" }}>{auth.user?.fullName}</Text>
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {roles.map((r) => (
            <View
              key={r}
              style={{
                backgroundColor: colors.primarySoft,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8
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
        <StatPill label="Discover" value="Members" />
        <StatPill label="Jobs" value="Board" />
        <StatPill label="Chat" value="Inbox" />
      </View>

      <Card>
        <SectionTitle title="Quick tips" />
        <Text style={{ color: colors.muted, lineHeight: 20, fontSize: 14 }}>
          • Complete your profile and add a profile photo{"\n"}
          • Use Discover to find talent cards{"\n"}
          • Employers can post jobs from the Post tab
        </Text>
      </Card>

      <DangerButton title="Sign out" onPress={auth.signOut} />
    </ScreenLayout>
  );
}
