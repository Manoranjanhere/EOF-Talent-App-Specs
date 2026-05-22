import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput } from "react-native";
import { submitFeedback } from "../../services/feedback.service";
import { useAuth } from "../../state/auth-context";

export function HelpFeedbackScreen() {
  const { accessToken } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async () => {
    if (!accessToken) return;
    try {
      await submitFeedback(accessToken, { subject, message });
      Alert.alert("Submitted", "Feedback/help request sent");
      setSubject("");
      setMessage("");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Feedback & Help</Text>
      <TextInput
        value={subject}
        onChangeText={setSubject}
        placeholder="Subject"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Message"
        multiline
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, minHeight: 140 }}
      />
      <Button title="Submit" onPress={onSubmit} />
    </ScrollView>
  );
}
