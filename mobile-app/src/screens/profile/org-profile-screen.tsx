import React, { useState } from "react";
import { Alert } from "react-native";
import {
  Card,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SectionTitle
} from "../../components/ui";
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
      Alert.alert("Saved", "Company profile updated successfully.");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Company profile" subtitle="Employer or agency business details">
      <Card>
        <SectionTitle title="Organization" />
        <LabeledInput
          label="Org type ID"
          value={orgTypeId}
          onChangeText={setOrgTypeId}
          keyboardType="numeric"
          hint="1=Talent Employer, 2=Agency, 3=Venue, 4=Production"
        />
        <LabeledInput label="Legal name" value={legalName} onChangeText={setLegalName} placeholder="Company name" />
        <LabeledInput label="Tax ID" value={taxId} onChangeText={setTaxId} placeholder="GST / Tax number" />
        <LabeledInput label="Contact person" value={contactName} onChangeText={setContactName} placeholder="Hiring manager" />
        <PrimaryButton title="Save company profile" onPress={onSave} loading={loading} disabled={loading} />
      </Card>
    </ScreenLayout>
  );
}
