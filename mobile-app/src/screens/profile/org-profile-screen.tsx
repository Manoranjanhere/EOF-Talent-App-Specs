import React, { useEffect, useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Card,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle
} from "../../components/ui";
import {
  getProfile,
  listOrgTypes,
  updateOrgProfile,
  uploadProfilePhoto
} from "../../services/profile.service";
import { mediaUrl } from "../../services/albums.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

type OrgType = { id: number; name: string };

export function OrgProfileScreen({ navigation }: { navigation?: any }) {
  const { accessToken, user } = useAuth();
  const { colors } = useTheme();
  const [orgTypes, setOrgTypes] = useState<OrgType[]>([]);
  const [orgTypeId, setOrgTypeId] = useState<number | null>(null);
  const [legalName, setLegalName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [taxId, setTaxId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPosition, setContactPosition] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [hasProfilePhoto, setHasProfilePhoto] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void load();
  }, [accessToken, user?.id]);

  const load = async () => {
    try {
      const types = await listOrgTypes();
      setOrgTypes(types);
      if (!accessToken || !user?.id) {
        if (types[0]) setOrgTypeId(types[0].id);
        return;
      }
      const profile = (await getProfile(user.id, accessToken)) as any;
      const org = profile.profileOrg;
      setOrgTypeId(org?.orgTypeId ?? profile.defaultOrgTypeId ?? types[0]?.id ?? null);
      setLegalName(org?.legalName ?? "");
      setAddressLine(org?.addressLine ?? "");
      setTaxId(org?.taxId ?? "");
      setContactName(org?.contactName ?? "");
      setContactPosition(org?.contactPosition ?? "");
      setContactNumber(org?.contactNumber ?? "");
      setContactEmail(org?.contactEmail ?? "");
      setWebsiteUrl(profile.websiteUrl ?? "");
      setInstagramUrl(profile.instagramUrl ?? "");
      setFacebookUrl(profile.facebookUrl ?? "");
      setHasProfilePhoto(Boolean(profile.profilePhotoAssetId || profile.profilePhotoUrl));
      const existing = mediaUrl(profile.profilePhotoUrl);
      if (existing) setPhotoUri(existing);
    } catch (error) {
      Alert.alert("Load failed", (error as Error).message);
    }
  };

  const onPickPhoto = async () => {
    if (!accessToken) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access for your profile photo.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1]
    });
    if (picked.canceled || !picked.assets?.[0]) return;

    const asset = picked.assets[0];
    setPhotoUri(asset.uri);
    try {
      setUploadingPhoto(true);
      await uploadProfilePhoto(accessToken, asset.uri, asset.mimeType ?? "image/jpeg");
      setHasProfilePhoto(true);
      Alert.alert("Photo uploaded", "Profile photo saved.");
    } catch (error) {
      Alert.alert("Photo upload failed", (error as Error).message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSave = async () => {
    if (!accessToken) return;
    if (!hasProfilePhoto) {
      Alert.alert("Profile photo required", "Upload a company / contact photo before saving.");
      return;
    }
    if (!orgTypeId) {
      Alert.alert("Org type", "Please select an employer type.");
      return;
    }
    if (!legalName.trim()) {
      Alert.alert("Missing name", "Please enter the organization name.");
      return;
    }
    if (!addressLine.trim()) {
      Alert.alert("Missing address", "Please enter the business address.");
      return;
    }
    if (!contactName.trim() || !contactNumber.trim() || !contactEmail.trim()) {
      Alert.alert(
        "Contact required",
        "Contact name, number, and email are required."
      );
      return;
    }

    try {
      setLoading(true);
      await updateOrgProfile(accessToken, {
        orgTypeId,
        legalName: legalName.trim(),
        addressLine: addressLine.trim(),
        taxId: taxId.trim() || undefined,
        contactName: contactName.trim(),
        contactPosition: contactPosition.trim() || undefined,
        contactNumber: contactNumber.trim(),
        contactEmail: contactEmail.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined
      });
      if (navigation) {
        navigation.navigate("ProfileHub", { profileUpdated: true });
      } else {
        Alert.alert("Saved", "Company profile updated successfully.");
      }
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="Edit company"
      subtitle="Photo required · company details for Employer / Agency"
      footer={
        navigation ? (
          <SecondaryButton title="Back to profile" onPress={() => navigation.goBack()} />
        ) : undefined
      }
    >
      <Card>
        <SectionTitle title="Profile photo (required)" />
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 8 }}
          />
        ) : (
          <Text style={{ color: colors.muted, marginBottom: 8 }}>
            Add a company logo or contact photo.
          </Text>
        )}
        <SecondaryButton
          title={uploadingPhoto ? "Uploading..." : "Choose / upload photo"}
          onPress={onPickPhoto}
          disabled={uploadingPhoto}
        />
      </Card>

      <Card>
        <SectionTitle title="Employer type" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {orgTypes.map((type) => {
            const selected = orgTypeId === type.id;
            return (
              <Pressable
                key={type.id}
                onPress={() => setOrgTypeId(type.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.card
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13 }}>{type.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <SectionTitle title="Organization" />
        <LabeledInput
          label="Name"
          value={legalName}
          onChangeText={setLegalName}
          placeholder="Company / agency name"
        />
        <LabeledInput
          label="Address"
          value={addressLine}
          onChangeText={setAddressLine}
          placeholder="Business address"
          multiline
          style={{ minHeight: 72, textAlignVertical: "top" }}
        />
        <LabeledInput
          label="Tax ID"
          value={taxId}
          onChangeText={setTaxId}
          placeholder="GST / Tax number"
        />
      </Card>

      <Card>
        <SectionTitle title="Contact" />
        <LabeledInput
          label="Contact name"
          value={contactName}
          onChangeText={setContactName}
          placeholder="Hiring manager"
        />
        <LabeledInput
          label="Contact position"
          value={contactPosition}
          onChangeText={setContactPosition}
          placeholder="HR Manager / Casting Director"
        />
        <LabeledInput
          label="Contact number"
          value={contactNumber}
          onChangeText={setContactNumber}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />
        <LabeledInput
          label="Contact email"
          value={contactEmail}
          onChangeText={setContactEmail}
          placeholder="hiring@company.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </Card>

      <Card>
        <SectionTitle title="Online presence" />
        <LabeledInput
          label="Website"
          value={websiteUrl}
          onChangeText={setWebsiteUrl}
          placeholder="https://company.com"
          autoCapitalize="none"
        />
        <LabeledInput
          label="Instagram (optional)"
          value={instagramUrl}
          onChangeText={setInstagramUrl}
          placeholder="https://instagram.com/..."
          autoCapitalize="none"
        />
        <LabeledInput
          label="Facebook (optional)"
          value={facebookUrl}
          onChangeText={setFacebookUrl}
          placeholder="https://facebook.com/..."
          autoCapitalize="none"
        />
        <PrimaryButton
          title={loading ? "Saving..." : "Save company profile"}
          onPress={onSave}
          loading={loading}
          disabled={loading || uploadingPhoto}
        />
      </Card>
    </ScreenLayout>
  );
}
