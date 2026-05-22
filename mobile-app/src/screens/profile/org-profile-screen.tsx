import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput } from "react-native";
import { updateOrgProfile } from "../../services/profile.service";
import { useAuth } from "../../state/auth-context";

export function OrgProfileScreen() {
  const { accessToken } = useAuth();
  const [orgTypeId, setOrgTypeId] = useState("1");
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [contactName, setContactName] = useState("");
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      await updateOrgProfile(accessToken, {
        orgTypeId: Number(orgTypeId),
        legalName,
        taxId,
        contactName
      });
      Alert.alert("Saved", "Organization profile updated");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Employer/Agency Profile</Text>
      <TextInput
        value={orgTypeId}
        onChangeText={setOrgTypeId}
        keyboardType="numeric"
        placeholder="Org Type Id"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        value={legalName}
        onChangeText={setLegalName}
        placeholder="Legal Name"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        value={taxId}
        onChangeText={setTaxId}
        placeholder="Tax Id"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        value={contactName}
        onChangeText={setContactName}
        placeholder="Contact Name"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <Button title={loading ? "Saving..." : "Save"} onPress={onSave} disabled={loading} />
    </ScrollView>
  );
}
