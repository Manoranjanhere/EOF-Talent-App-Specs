import React from "react";
import { Text } from "react-native";
import { LinkButton, ScreenLayout, SectionTitle } from "../../components/ui";
import { useTheme } from "../../theme/theme-context";

export function TermsOfServiceScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  return (
    <ScreenLayout
      title="Terms of Service"
      subtitle="Rules for using EOF Talent"
      footer={<LinkButton title="Back" onPress={() => navigation.goBack()} />}
    >
      <SectionTitle title="Accounts" />
      <Text style={{ color: colors.text, lineHeight: 22, marginBottom: 16 }}>
        You must provide accurate information, keep your login secure, and be at least 18 years old
        (or the age of majority where you live). We may suspend accounts that violate these terms or
        community safety rules.
      </Text>

      <SectionTitle title="Marketplace use" />
      <Text style={{ color: colors.text, lineHeight: 22, marginBottom: 16 }}>
        EOF Talent connects talent with employers and agencies. Listings, profiles, and messages must
        be lawful and professional. Scams, harassment, illegal content, and impersonation are
        prohibited and may lead to bans.
      </Text>

      <SectionTitle title="Subscriptions" />
      <Text style={{ color: colors.text, lineHeight: 22, marginBottom: 16 }}>
        Employer messaging and job posting purchases are sold as Google Play subscriptions or in-app
        products. Pricing, renewals, and refunds follow Google Play policies. Entitlements unlock
        in-app features after Play confirms payment.
      </Text>

      <SectionTitle title="Content" />
      <Text style={{ color: colors.text, lineHeight: 22, marginBottom: 16 }}>
        You retain rights to content you upload and grant EOF Talent a license to host and display it
        for the service. Do not upload content you do not have rights to share.
      </Text>

      <SectionTitle title="Liability" />
      <Text style={{ color: colors.text, lineHeight: 22 }}>
        The app is provided as-is. We are not responsible for agreements made between members outside
        the platform. Use Help to report problems; we will investigate in good faith.
      </Text>
    </ScreenLayout>
  );
}
