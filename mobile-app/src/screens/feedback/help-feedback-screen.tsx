import React, { useState } from "react";
import { Alert } from "react-native";
import {
  Card,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SectionTitle
} from "../../components/ui";
import { submitFeedback } from "../../services/feedback.service";
import { useAuth } from "../../state/auth-context";

export function HelpFeedbackScreen() {
  const { accessToken } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!accessToken) return;
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Missing info", "Please enter subject and message.");
      return;
    }
    try {
      setLoading(true);
      await submitFeedback(accessToken, { subject: subject.trim(), message: message.trim() });
      Alert.alert("Submitted", "Thanks! Our team will review your request.");
      setSubject("");
      setMessage("");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Help & feedback" subtitle="Report issues or ask for support">
      <Card>
        <SectionTitle title="Contact support" />
        <LabeledInput label="Subject" value={subject} onChangeText={setSubject} placeholder="Brief summary" />
        <LabeledInput
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue or question..."
          multiline
          style={{ minHeight: 140, textAlignVertical: "top" }}
        />
        <PrimaryButton title="Submit ticket" onPress={onSubmit} loading={loading} disabled={loading} />
      </Card>
    </ScreenLayout>
  );
}
