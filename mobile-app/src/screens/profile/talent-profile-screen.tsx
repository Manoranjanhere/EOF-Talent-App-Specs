import React, { useState } from "react";
import { Alert } from "react-native";
import {
  Card,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SectionTitle
} from "../../components/ui";
import { updateTalentProfile } from "../../services/profile.service";
import { useAuth } from "../../state/auth-context";

export function TalentProfileScreen() {
  const { accessToken } = useAuth();
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [miniBio, setMiniBio] = useState("");
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      await updateTalentProfile(accessToken, { fullName, city, country, miniBio });
      Alert.alert("Saved", "Talent profile updated successfully.");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="My profile" subtitle="Showcase your talent to employers and agencies">
      <Card>
        <SectionTitle title="Basic info" />
        <LabeledInput label="Display name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
        <LabeledInput label="City" value={city} onChangeText={setCity} placeholder="Mumbai" />
        <LabeledInput label="Country" value={country} onChangeText={setCountry} placeholder="India" />
        <LabeledInput
          label="Mini bio"
          value={miniBio}
          onChangeText={setMiniBio}
          placeholder="Tell employers about your experience..."
          multiline
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <PrimaryButton title="Save profile" onPress={onSave} loading={loading} disabled={loading} />
      </Card>
    </ScreenLayout>
  );
}
