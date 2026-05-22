import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput } from "react-native";
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
      Alert.alert("Saved", "Talent profile updated");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Talent Profile</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder="Name"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
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
      <TextInput
        value={miniBio}
        onChangeText={setMiniBio}
        placeholder="Mini bio"
        multiline
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, minHeight: 120 }}
      />
      <Button title={loading ? "Saving..." : "Save"} onPress={onSave} disabled={loading} />
    </ScrollView>
  );
}
