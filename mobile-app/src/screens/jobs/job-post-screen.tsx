import React, { useState } from "react";
import { Alert } from "react-native";
import {
  Card,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SectionTitle
} from "../../components/ui";
import { postJob } from "../../services/jobs.service";
import { useAuth } from "../../state/auth-context";

export function JobPostScreen() {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [miniDescription, setMiniDescription] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);

  const onPost = async () => {
    if (!accessToken) return;
    if (!title.trim() || !miniDescription.trim()) {
      Alert.alert("Missing fields", "Title and description are required.");
      return;
    }
    try {
      setLoading(true);
      await postJob(accessToken, {
        title: title.trim(),
        miniDescription: miniDescription.trim(),
        city,
        country,
        primaryTagIds: [],
        secondaryTagIds: []
      });
      Alert.alert("Success", "Job posted successfully (90-day validity).");
      setTitle("");
      setMiniDescription("");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Post a job" subtitle="Reach talent on the EOF marketplace">
      <Card>
        <SectionTitle title="Job details" />
        <LabeledInput label="Job title" value={title} onChangeText={setTitle} placeholder="Lead actor for web series" />
        <LabeledInput
          label="Description"
          value={miniDescription}
          onChangeText={setMiniDescription}
          placeholder="Shoot dates, requirements, pay..."
          multiline
          style={{ minHeight: 110, textAlignVertical: "top" }}
        />
        <LabeledInput label="City" value={city} onChangeText={setCity} placeholder="Mumbai" />
        <LabeledInput label="Country" value={country} onChangeText={setCountry} placeholder="India" />
        <PrimaryButton title="Publish job" onPress={onPost} loading={loading} disabled={loading} />
      </Card>
    </ScreenLayout>
  );
}
