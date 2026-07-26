import React from "react";
import { Text } from "react-native";
import { LinkButton, ScreenLayout, SectionTitle } from "../../components/ui";
import { useTheme } from "../../theme/theme-context";

export function PrivacyPolicyScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  return (
    <ScreenLayout
      title="Privacy Policy"
      subtitle="How EOF Talent handles your data"
      footer={<LinkButton title="Back" onPress={() => navigation.goBack()} />}
    >
      <SectionTitle title="What we collect" />
      <Text style={{ color: colors.text, lineHeight: 22, marginBottom: 16 }}>
        We collect account details you provide (name, email, mobile number), profile information
        (photos, skills, bio, location), organization details for employers, and usage data needed to
        run messaging, albums, and job posts.
      </Text>

      <SectionTitle title="How we use it" />
      <Text style={{ color: colors.text, lineHeight: 22, marginBottom: 16 }}>
        Data is used to create and secure your account, show relevant talent or jobs, deliver chat,
        process Google Play subscriptions, prevent abuse, and improve the product. We do not sell your
        personal information.
      </Text>

      <SectionTitle title="Media & albums" />
      <Text style={{ color: colors.text, lineHeight: 22, marginBottom: 16 }}>
        Profile photos and public albums may be visible to other members. Private albums are shared
        only with people you grant access to. Media files are delivered through short-lived signed
        URLs and are not meant to be publicly browsable by guessing a link.
      </Text>

      <SectionTitle title="Payments" />
      <Text style={{ color: colors.text, lineHeight: 22, marginBottom: 16 }}>
        Paid messaging and job posting slots are billed through Google Play. Payment details are
        handled by Google; we store purchase tokens and entitlement records needed to unlock features.
      </Text>

      <SectionTitle title="Contact" />
      <Text style={{ color: colors.text, lineHeight: 22 }}>
        For privacy requests, use Help → feedback in the app or contact the EOF Talent support team
        listed on our website.
      </Text>
    </ScreenLayout>
  );
}
