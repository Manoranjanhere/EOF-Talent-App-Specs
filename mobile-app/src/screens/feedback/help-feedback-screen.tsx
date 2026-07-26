import React, { useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import {
  Card,
  LabeledInput,
  LinkButton,
  PrimaryButton,
  ScreenLayout,
  SectionTitle
} from "../../components/ui";
import { submitFeedback } from "../../services/feedback.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import { PrivacyPolicyScreen } from "../legal/privacy-policy-screen";
import { TermsOfServiceScreen } from "../legal/terms-of-service-screen";

const FAQ_ITEMS = [
  {
    q: "How do I update my profile?",
    a: "Open Profile → Edit profile. Add your photo, skills, city, and bio so employers can find you."
  },
  {
    q: "How do albums work?",
    a: "Talent can create up to 5 albums (9 photos + 1 video each). Public albums are visible to employers; private albums need access grants."
  },
  {
    q: "How much does messaging cost?",
    a: "Talent can message for free. Employers & agencies: ₹300/month via Google Play — subscribe from the Chat tab before sending messages."
  },
  {
    q: "How do I post a job?",
    a: "Employers: Post job tab → buy a ₹300 slot in Google Play → fill title, skills, pay range, and publish. Listings stay live for 90 days."
  },
  {
    q: "Where are Privacy Policy and Terms?",
    a: "Use the Privacy Policy and Terms links below on this Help tab, or on Sign-in / Register."
  },
  {
    q: "How do employers find talent?",
    a: "Discover tab → search by city, skills, availability → tap a profile to view albums and send a message."
  },
  {
    q: "How do I report a profile?",
    a: "On Discover search results, tap Flag profile. Admins review reports in the moderation queue."
  }
];

export function HelpFeedbackScreen() {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [legalView, setLegalView] = useState<"privacy" | "terms" | null>(null);

  if (legalView === "privacy") {
    return <PrivacyPolicyScreen navigation={{ goBack: () => setLegalView(null) }} />;
  }
  if (legalView === "terms") {
    return <TermsOfServiceScreen navigation={{ goBack: () => setLegalView(null) }} />;
  }

  const onSubmit = async () => {
    if (!accessToken) {
      Alert.alert("Sign in required", "Please sign in to send feedback.");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Missing info", "Please enter subject and message.");
      return;
    }
    try {
      setLoading(true);
      await submitFeedback(accessToken, { subject: subject.trim(), message: message.trim() });
      Alert.alert(
        "Feedback sent",
        "Your message was delivered to Admin and Super Admin in-app chat."
      );
      setSubject("");
      setMessage("");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Help & feedback" subtitle="Q&A · contact Admin & Super Admin">
      <Card>
        <SectionTitle title="Basic Q&A" />
        {FAQ_ITEMS.map((item, index) => {
          const open = openFaq === index;
          return (
            <Pressable
              key={item.q}
              onPress={() => setOpenFaq(open ? null : index)}
              style={{
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.border
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>{item.q}</Text>
              {open ? (
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 20 }}>
                  {item.a}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <SectionTitle title="Legal" />
        <LinkButton title="Privacy Policy" onPress={() => setLegalView("privacy")} />
        <LinkButton title="Terms of Service" onPress={() => setLegalView("terms")} />
      </Card>

      <Card>
        <SectionTitle title="Send feedback" />
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10 }}>
          Your feedback is sent as a chat message to all Admin and Super Admin accounts.
        </Text>
        <LabeledInput label="Subject" value={subject} onChangeText={setSubject} placeholder="Brief summary" />
        <LabeledInput
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue, question, or suggestion..."
          multiline
          style={{ minHeight: 140, textAlignVertical: "top" }}
        />
        <PrimaryButton title="Submit feedback" onPress={onSubmit} loading={loading} disabled={loading} />
      </Card>
    </ScreenLayout>
  );
}
