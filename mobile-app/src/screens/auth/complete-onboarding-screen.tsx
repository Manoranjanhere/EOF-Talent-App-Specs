import React, { useEffect, useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
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
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

/** Forced completion for accounts that signed in without finishing signup details. */
export function CompleteOnboardingScreen() {
  const auth = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  if (auth.onboarding === "talent") {
    return <TalentPhotoGate loading={loading} setLoading={setLoading} />;
  }

  if (auth.onboarding === "employer") {
    return <EmployerDetailsGate loading={loading} setLoading={setLoading} />;
  }

  return (
    <ScreenLayout title="Almost done" subtitle="Checking your profile...">
      <Text style={{ color: colors.muted }}>Please wait…</Text>
    </ScreenLayout>
  );
}

function TalentPhotoGate({
  loading,
  setLoading
}: {
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const auth = useAuth();
  const { colors } = useTheme();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [mime, setMime] = useState("image/jpeg");

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1]
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    setPhotoUri(picked.assets[0].uri);
    setMime(picked.assets[0].mimeType ?? "image/jpeg");
  };

  const save = async () => {
    if (!auth.accessToken || !photoUri) {
      Alert.alert("Profile photo required", "Add a profile photo to continue.");
      return;
    }
    try {
      setLoading(true);
      await uploadProfilePhoto(auth.accessToken, photoUri, mime);
      auth.completeOnboarding();
    } catch (error) {
      Alert.alert("Upload failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="Add profile photo"
      subtitle="Required before using EOF Talent"
      footer={<SecondaryButton title="Sign out" onPress={auth.signOut} />}
    >
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={{ width: 140, height: 140, borderRadius: 70, alignSelf: "center" }}
        />
      ) : (
        <View
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            alignSelf: "center",
            backgroundColor: colors.inset,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Text style={{ color: colors.muted }}>No photo</Text>
        </View>
      )}
      <SecondaryButton title="Choose photo" onPress={pick} />
      <PrimaryButton
        title={loading ? "Saving..." : "Continue"}
        onPress={save}
        loading={loading}
        disabled={loading}
      />
    </ScreenLayout>
  );
}

function EmployerDetailsGate({
  loading,
  setLoading
}: {
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const auth = useAuth();
  const { colors } = useTheme();
  const [orgTypes, setOrgTypes] = useState<Array<{ id: number; name: string }>>([]);
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
  const [photoMime, setPhotoMime] = useState("image/jpeg");

  useEffect(() => {
    void (async () => {
      const types = await listOrgTypes();
      setOrgTypes(types);
      if (types[0]) setOrgTypeId(types[0].id);

      if (!auth.accessToken || !auth.user?.id) return;
      try {
        const profile = (await getProfile(auth.user.id, auth.accessToken)) as any;
        const org = profile.profileOrg;
        if (org?.orgTypeId) setOrgTypeId(org.orgTypeId);
        else if (profile.defaultOrgTypeId) setOrgTypeId(profile.defaultOrgTypeId);
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
      } catch {
        // keep empty form
      }
    })();
  }, [auth.accessToken, auth.user?.id]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1]
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    setPhotoUri(picked.assets[0].uri);
    setPhotoMime(picked.assets[0].mimeType ?? "image/jpeg");
  };

  const save = async () => {
    if (!auth.accessToken || !orgTypeId) return;
    if (!photoUri) {
      Alert.alert(
        "Profile photo required",
        "Add a company logo or contact profile photo to continue."
      );
      return;
    }
    if (
      !legalName.trim() ||
      !addressLine.trim() ||
      !taxId.trim() ||
      !contactName.trim() ||
      !contactPosition.trim() ||
      !contactNumber.trim() ||
      !contactEmail.trim() ||
      !websiteUrl.trim()
    ) {
      Alert.alert(
        "Missing details",
        "Name, Address, Tax ID, Contact fields and Website are required. Instagram/Facebook are optional."
      );
      return;
    }
    try {
      setLoading(true);
      await uploadProfilePhoto(auth.accessToken, photoUri, photoMime);
      await updateOrgProfile(auth.accessToken, {
        orgTypeId,
        legalName: legalName.trim(),
        addressLine: addressLine.trim(),
        taxId: taxId.trim(),
        contactName: contactName.trim(),
        contactPosition: contactPosition.trim(),
        contactNumber: contactNumber.trim(),
        contactEmail: contactEmail.trim(),
        websiteUrl: websiteUrl.trim(),
        instagramUrl: instagramUrl.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined
      });
      auth.completeOnboarding();
    } catch (error) {
      Alert.alert("Save failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="Company details"
      subtitle="Photo + company info required for Employer / Agency"
      footer={<SecondaryButton title="Sign out" onPress={auth.signOut} />}
    >
      <SectionTitle title="Profile photo (required)" />
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={{ width: 120, height: 120, borderRadius: 60, alignSelf: "center" }}
        />
      ) : (
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            alignSelf: "center",
            backgroundColor: colors.inset,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Text style={{ color: colors.muted }}>No photo</Text>
        </View>
      )}
      <SecondaryButton
        title={photoUri ? "Change photo" : "Add profile photo"}
        onPress={pickPhoto}
      />

      <SectionTitle title="Employer type" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {orgTypes.map((type) => {
          const selected = orgTypeId === type.id;
          return (
            <SecondaryButton
              key={type.id}
              title={selected ? `✓ ${type.name}` : type.name}
              onPress={() => setOrgTypeId(type.id)}
            />
          );
        })}
      </View>
      <LabeledInput label="Name" value={legalName} onChangeText={setLegalName} placeholder="Company name" />
      <LabeledInput
        label="Address"
        value={addressLine}
        onChangeText={setAddressLine}
        placeholder="Business address"
        multiline
        style={{ minHeight: 72, textAlignVertical: "top" }}
      />
      <LabeledInput label="Tax ID" value={taxId} onChangeText={setTaxId} placeholder="GST / Tax" />
      <LabeledInput label="Contact name" value={contactName} onChangeText={setContactName} />
      <LabeledInput
        label="Contact position"
        value={contactPosition}
        onChangeText={setContactPosition}
      />
      <LabeledInput
        label="Contact number"
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
      />
      <LabeledInput
        label="Contact email"
        value={contactEmail}
        onChangeText={setContactEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <LabeledInput
        label="Website"
        value={websiteUrl}
        onChangeText={setWebsiteUrl}
        autoCapitalize="none"
      />
      <LabeledInput
        label="Instagram (optional)"
        value={instagramUrl}
        onChangeText={setInstagramUrl}
        autoCapitalize="none"
      />
      <LabeledInput
        label="Facebook (optional)"
        value={facebookUrl}
        onChangeText={setFacebookUrl}
        autoCapitalize="none"
      />
      <PrimaryButton
        title={loading ? "Saving..." : "Save & continue"}
        onPress={save}
        loading={loading}
        disabled={loading}
      />
    </ScreenLayout>
  );
}
