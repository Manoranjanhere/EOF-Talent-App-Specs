import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput } from "react-native";
import { postJob } from "../../services/jobs.service";
import { useAuth } from "../../state/auth-context";

export function JobPostScreen() {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [miniDescription, setMiniDescription] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const onPost = async () => {
    if (!accessToken) return;
    try {
      await postJob(accessToken, {
        title,
        miniDescription,
        city,
        country,
        primaryTagIds: [],
        secondaryTagIds: []
      });
      Alert.alert("Success", "Job posted");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Post a Job</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        value={miniDescription}
        onChangeText={setMiniDescription}
        placeholder="Mini description"
        multiline
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, minHeight: 120 }}
      />
      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder="City"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        value={country}
        onChangeText={setCountry}
        placeholder="Country"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <Button title="Post Job" onPress={onPost} />
    </ScrollView>
  );
}
