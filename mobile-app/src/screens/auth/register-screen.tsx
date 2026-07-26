import React, { useEffect, useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { GroupId } from "@eof/shared";
import * as ImagePicker from "expo-image-picker";
import {
  LabeledInput,
  LegalFinePrint,
  LinkButton,
  PrimaryButton,
  RoleSelector,
  ScreenLayout,
  SecondaryButton,
  SectionTitle,
  SegmentedControl
} from "../../components/ui";
import { ThemeToggleButton } from "../../components/theme-toggle-button";
import type { GenderValue } from "../../constants/gender";
import { GENDER_OPTIONS } from "../../constants/gender";
import { registerUser, sendRegistrationOtp } from "../../services/auth.service";
import {
  clearFirebaseOtpSession,
  confirmFirebaseOtp,
  mapFirebaseAuthError,
  sendFirebaseOtp,
  toE164,
  useFirebasePhoneAuth
} from "../../services/firebase-phone-auth";
import {
  listOrgTypes,
  listPublishedTags,
  setProfileTags,
  updateOrgProfile,
  updateTalentProfile,
  uploadProfilePhoto
} from "../../services/profile.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

type Step = "account" | "details";
type TagOption = { id: string; slug: string; title: string };

function toggleId(list: string[], id: string, max: number): string[] {
  if (list.includes(id)) return list.filter((item) => item !== id);
  if (list.length >= max) return list;
  return [...list, id];
}

export function RegisterScreen({ navigation }: { navigation: any }) {
  const [step, setStep] = useState<Step>("account");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [usingFirebase, setUsingFirebase] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [groupId, setGroupId] = useState<number>(GroupId.Talent);

  // Talent step-2
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState("image/jpeg");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<GenderValue>("Male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [talentInstagram, setTalentInstagram] = useState("");
  const [snapchatUrl, setSnapchatUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [miniBio, setMiniBio] = useState("");
  const [isAvailable, setIsAvailable] = useState<"yes" | "no">("yes");
  const [tags, setTags] = useState<TagOption[]>([]);
  const [primaryTagIds, setPrimaryTagIds] = useState<string[]>([]);
  const [secondaryTagIds, setSecondaryTagIds] = useState<string[]>([]);

  // Employer step-2
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

  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  /** Set after OTP succeeds on step 1 — reused on final register (Firebase confirm is one-shot). */
  const [verifiedFirebaseIdToken, setVerifiedFirebaseIdToken] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const auth = useAuth();
  const { colors } = useTheme();
  const isEmployer = groupId === GroupId.TalentEmployerOrAgency;

  useEffect(() => {
    void listOrgTypes()
      .then((types) => {
        setOrgTypes(types);
        if (types[0]) setOrgTypeId(types[0].id);
      })
      .catch(() => undefined);
    void listPublishedTags()
      .then((list) => {
        setTags(Array.isArray(list) ? list : []);
        if (!Array.isArray(list) || list.length === 0) {
          Alert.alert(
            "No skills found",
            "Skill tags are not set up on the server yet. Ask admin to run DB seed, then reopen Register."
          );
        }
      })
      .catch((error) => {
        Alert.alert("Could not load skills", (error as Error).message);
      });
  }, []);

  const onSendOtp = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert("Missing mobile", "Please enter your mobile number.");
      return;
    }

    try {
      setSendingOtp(true);
      const firebaseOn = useFirebasePhoneAuth();
      setUsingFirebase(firebaseOn);

      if (firebaseOn) {
        const { e164 } = await sendFirebaseOtp(mobileNumber.trim());
        setOtpSent(true);
        setOtpHint(`SMS sent to ${e164}. Enter the code from your messages.`);
        Alert.alert("OTP sent", `Check SMS on ${e164}`);
        return;
      }

      const response = await sendRegistrationOtp({
        mobileNumber: toE164(mobileNumber.trim())
      });
      setOtpSent(true);
      setOtpHint(
        response.otpCode
          ? `Dev OTP: ${response.otpCode}`
          : "Enter the OTP sent to your mobile."
      );
      Alert.alert(
        "OTP sent",
        response.otpCode
          ? `Dev mode OTP: ${response.otpCode}`
          : "Enter the OTP sent to your phone."
      );
    } catch (error) {
      Alert.alert("Send OTP failed", mapFirebaseAuthError(error));
    } finally {
      setSendingOtp(false);
    }
  };

  const validateAccountStep = () => {
    if (!fullName.trim()) {
      Alert.alert("Missing name", "Please enter your full name.");
      return false;
    }
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email address.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Invalid email", "Enter a valid email address.");
      return false;
    }
    if (!mobileNumber.trim()) {
      Alert.alert("Missing mobile", "Please enter your mobile number.");
      return false;
    }
    if (!otpSent || otpCode.trim().length < 4) {
      Alert.alert("Verify phone", "Send and enter the phone OTP first.");
      return false;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Password and confirm password must match.");
      return false;
    }
    return true;
  };

  const onContinue = async () => {
    if (!validateAccountStep()) return;
    if (phoneVerified && (verifiedFirebaseIdToken || !usingFirebase)) {
      setStep("details");
      return;
    }

    try {
      setVerifyingOtp(true);
      const firebaseOn = useFirebasePhoneAuth();
      setUsingFirebase(firebaseOn);

      if (firebaseOn) {
        const confirmed = await confirmFirebaseOtp(otpCode.trim());
        setVerifiedFirebaseIdToken(confirmed.firebaseIdToken);
        setPhoneVerified(true);
      } else {
        // Dev bypass: OTP must still be present; API validates the code at register.
        if (!otpSent || otpCode.trim().length < 4) {
          Alert.alert("Verify phone", "Send and enter the OTP first.");
          return;
        }
        setVerifiedFirebaseIdToken(null);
        setPhoneVerified(true);
      }
      setStep("details");
    } catch (error) {
      Alert.alert("OTP verification failed", mapFirebaseAuthError(error));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onPickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access for your profile photo.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1]
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    setPhotoUri(picked.assets[0].uri);
    setPhotoMime(picked.assets[0].mimeType ?? "image/jpeg");
  };

  const validateDetailsStep = () => {
    if (!isEmployer) {
      if (!photoUri) {
        Alert.alert("Profile photo required", "Add a profile photo to finish creating your account.");
        return false;
      }
      if (!fullName.trim()) {
        Alert.alert("Missing name", "Enter your name.");
        return false;
      }
      if (!age.trim()) {
        Alert.alert("Missing age", "Enter your age.");
        return false;
      }
      if (!gender) {
        Alert.alert("Select gender", "Choose Male or Female.");
        return false;
      }
      if (!heightCm.trim() || !weightKg.trim()) {
        Alert.alert("Missing measurements", "Enter height (cm) and weight (kg).");
        return false;
      }
      if (!city.trim() || !country.trim()) {
        Alert.alert("Missing location", "Enter city and country.");
        return false;
      }
      if (primaryTagIds.length < 1) {
        Alert.alert("Skills required", "Select at least 1 primary skill tag (up to 5).");
        return false;
      }
      if (!miniBio.trim()) {
        Alert.alert("Missing mini bio", "Write a short mini bio.");
        return false;
      }
      return true;
    }

    if (!orgTypeId) {
      Alert.alert("Employer type", "Select an employer / agency type.");
      return false;
    }
    if (!photoUri) {
      Alert.alert(
        "Profile photo required",
        "Add a company / contact profile photo to finish creating your account."
      );
      return false;
    }
    if (!legalName.trim()) {
      Alert.alert("Missing name", "Enter organization name.");
      return false;
    }
    if (!addressLine.trim()) {
      Alert.alert("Missing address", "Enter business address.");
      return false;
    }
    if (!taxId.trim()) {
      Alert.alert("Missing Tax ID", "Enter Tax / GST ID.");
      return false;
    }
    if (!contactName.trim()) {
      Alert.alert("Missing contact name", "Enter contact person name.");
      return false;
    }
    if (!contactPosition.trim()) {
      Alert.alert("Missing position", "Enter contact position.");
      return false;
    }
    if (!contactNumber.trim()) {
      Alert.alert("Missing contact number", "Enter contact phone number.");
      return false;
    }
    if (!contactEmail.trim()) {
      Alert.alert("Missing contact email", "Enter contact email.");
      return false;
    }
    return true;
  };

  const onFinish = async () => {
    if (!phoneVerified) {
      Alert.alert("Verify phone", "Go back and verify your phone OTP before creating the account.");
      return;
    }
    if (!validateDetailsStep()) return;

    try {
      setLoading(true);
      const e164 = toE164(mobileNumber.trim());
      const firebaseIdToken = verifiedFirebaseIdToken ?? undefined;
      const otpForApi = firebaseIdToken ? undefined : otpCode.trim();

      const response = await registerUser({
        fullName: fullName.trim(),
        email: email.trim(),
        mobileNumber: e164,
        password,
        groupId,
        firebaseIdToken,
        otpCode: otpForApi
      });

      const token = response.tokens.accessToken;

      if (!isEmployer && photoUri) {
        await uploadProfilePhoto(token, photoUri, photoMime);
        await updateTalentProfile(token, {
          fullName: fullName.trim(),
          age: Number(age),
          gender,
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
          city: city.trim(),
          country: country.trim(),
          instagramUrl: talentInstagram.trim() || undefined,
          snapchatUrl: snapchatUrl.trim() || undefined,
          youtubeUrl: youtubeUrl.trim() || undefined,
          tiktokUrl: tiktokUrl.trim() || undefined,
          miniBio: miniBio.trim(),
          isAvailable: isAvailable === "yes"
        });
        await setProfileTags(token, { primaryTagIds, secondaryTagIds });
      }

      if (isEmployer && orgTypeId) {
        if (photoUri) {
          await uploadProfilePhoto(token, photoUri, photoMime);
        }
        await updateOrgProfile(token, {
          orgTypeId,
          legalName: legalName.trim(),
          addressLine: addressLine.trim(),
          taxId: taxId.trim(),
          contactName: contactName.trim(),
          contactPosition: contactPosition.trim(),
          contactNumber: contactNumber.trim(),
          contactEmail: contactEmail.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          instagramUrl: instagramUrl.trim() || undefined,
          facebookUrl: facebookUrl.trim() || undefined
        });
      }

      await auth.signIn({
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
        user: response.user,
        profileComplete: true
      });
    } catch (error) {
      Alert.alert("Registration failed", mapFirebaseAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  if (step === "details" && !isEmployer) {
    return (
      <ScreenLayout
        title="Talent profile"
        subtitle="Step 2 of 2 · Photo, details, skills & availability"
        headerRight={<ThemeToggleButton />}
        footer={<LinkButton title="Back" onPress={() => setStep("account")} />}
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
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Text style={{ color: colors.muted }}>No photo</Text>
          </View>
        )}
        <SecondaryButton
          title={photoUri ? "Change photo" : "Add profile photo"}
          onPress={onPickPhoto}
        />

        <SectionTitle title="Basic info" />
        <LabeledInput label="Name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
        <LabeledInput
          label="Age"
          value={age}
          onChangeText={setAge}
          placeholder="25"
          keyboardType="number-pad"
        />
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 6 }}>Gender</Text>
        <SegmentedControl
          value={gender}
          onChange={(value) => setGender(value as GenderValue)}
          options={GENDER_OPTIONS}
        />
        <LabeledInput
          label="Height (cm)"
          value={heightCm}
          onChangeText={setHeightCm}
          placeholder="170"
          keyboardType="decimal-pad"
        />
        <LabeledInput
          label="Weight (kg)"
          value={weightKg}
          onChangeText={setWeightKg}
          placeholder="60"
          keyboardType="decimal-pad"
        />
        <LabeledInput label="City" value={city} onChangeText={setCity} placeholder="Mumbai" />
        <LabeledInput label="Country" value={country} onChangeText={setCountry} placeholder="India" />

        <SectionTitle title="Social links (optional)" />
        <LabeledInput
          label="Instagram"
          value={talentInstagram}
          onChangeText={setTalentInstagram}
          placeholder="https://instagram.com/..."
          autoCapitalize="none"
        />
        <LabeledInput
          label="Snapchat"
          value={snapchatUrl}
          onChangeText={setSnapchatUrl}
          placeholder="https://snapchat.com/add/..."
          autoCapitalize="none"
        />
        <LabeledInput
          label="YouTube"
          value={youtubeUrl}
          onChangeText={setYoutubeUrl}
          placeholder="https://youtube.com/..."
          autoCapitalize="none"
        />
        <LabeledInput
          label="TikTok"
          value={tiktokUrl}
          onChangeText={setTiktokUrl}
          placeholder="https://tiktok.com/@..."
          autoCapitalize="none"
        />

        <SectionTitle title="Primary skills (max 5)" />
        {tags.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>
            No skills loaded. Check API connection, or seed the database on the server.
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {tags.map((tag) => {
            const selected = primaryTagIds.includes(tag.id);
            const disabled = secondaryTagIds.includes(tag.id);
            return (
              <Pressable
                key={`p-${tag.id}`}
                disabled={disabled}
                onPress={() => setPrimaryTagIds((prev) => toggleId(prev, tag.id, 5))}
                style={{
                  opacity: disabled ? 0.4 : 1,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.card
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13 }}>{tag.title}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title="Secondary skills (max 5)" />
        {tags.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>
            Skills will appear here after the server seed runs.
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {tags.map((tag) => {
            const selected = secondaryTagIds.includes(tag.id);
            const disabled = primaryTagIds.includes(tag.id);
            return (
              <Pressable
                key={`s-${tag.id}`}
                disabled={disabled}
                onPress={() => setSecondaryTagIds((prev) => toggleId(prev, tag.id, 5))}
                style={{
                  opacity: disabled ? 0.4 : 1,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.card
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13 }}>{tag.title}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title="About you" />
        <LabeledInput
          label="Mini bio"
          value={miniBio}
          onChangeText={setMiniBio}
          placeholder="Tell employers about your experience..."
          multiline
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 6 }}>
          Looking for work
        </Text>
        <SegmentedControl
          value={isAvailable}
          onChange={setIsAvailable}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" }
          ]}
        />
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
          Rating starts at 0/5. Only employers/agencies can rate you after signup.
        </Text>

        <PrimaryButton
          title={loading ? "Creating account..." : "Create talent account"}
          onPress={onFinish}
          disabled={loading}
          loading={loading}
        />
      </ScreenLayout>
    );
  }

  if (step === "details" && isEmployer) {
    return (
      <ScreenLayout
        title="Company details"
        subtitle="Step 2 of 2 · Photo + required company info"
        headerRight={<ThemeToggleButton />}
        footer={<LinkButton title="Back" onPress={() => setStep("account")} />}
      >
        <SectionTitle title="Profile photo (required)" />
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              alignSelf: "center",
              marginBottom: 8
            }}
          />
        ) : (
          <Text style={{ color: colors.muted, marginBottom: 8, textAlign: "center" }}>
            Add a company logo or contact photo
          </Text>
        )}
        <SecondaryButton
          title={photoUri ? "Change photo" : "Add profile photo"}
          onPress={onPickPhoto}
        />

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
        <LabeledInput label="Tax ID" value={taxId} onChangeText={setTaxId} placeholder="GST / Tax number" />
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
          placeholder="HR / Casting Director"
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
        <LabeledInput
          label="Website (optional)"
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
          title={loading ? "Creating account..." : "Create employer account"}
          onPress={onFinish}
          disabled={loading}
          loading={loading}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Create account"
      subtitle="Step 1 of 2 · Verify phone OTP, then continue to profile details"
      headerRight={<ThemeToggleButton />}
      footer={
        <>
          <LinkButton title="Already have an account? Sign in" onPress={() => navigation.goBack()} />
          <LegalFinePrint
            onPrivacy={() => navigation.navigate("PrivacyPolicy")}
            onTerms={() => navigation.navigate("TermsOfService")}
          />
        </>
      }
    >
      <RoleSelector value={groupId} onChange={setGroupId} />

      <LabeledInput
        label="Full name"
        placeholder="Your name"
        value={fullName}
        onChangeText={setFullName}
      />

      <LabeledInput
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <LabeledInput
        label="Mobile number"
        placeholder="10-digit mobile number"
        value={mobileNumber}
        onChangeText={(value) => {
          setMobileNumber(value);
          setOtpSent(false);
          setOtpCode("");
          setOtpHint(null);
          setPhoneVerified(false);
          setVerifiedFirebaseIdToken(null);
          clearFirebaseOtpSession();
        }}
        keyboardType="phone-pad"
      />

      <SecondaryButton
        title={sendingOtp ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send phone OTP"}
        onPress={onSendOtp}
        disabled={sendingOtp}
      />

      {otpSent ? (
        <>
          <LabeledInput
            label="Phone OTP"
            placeholder="Enter OTP from SMS"
            value={otpCode}
            onChangeText={(value) => {
              setOtpCode(value);
              setPhoneVerified(false);
              setVerifiedFirebaseIdToken(null);
            }}
            keyboardType="number-pad"
          />
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {otpHint ?? "Enter the OTP from your SMS."}
          </Text>
        </>
      ) : (
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          Send OTP next — then continue to{" "}
          {isEmployer ? "company photo + details" : "profile photo"}.
        </Text>
      )}

      <LabeledInput
        label="Password"
        placeholder="Minimum 8 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <LabeledInput
        label="Confirm password"
        placeholder="Re-enter password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <PrimaryButton
        title={
          verifyingOtp
            ? "Verifying OTP..."
            : phoneVerified
              ? "Continue"
              : "Verify OTP & continue"
        }
        onPress={onContinue}
        disabled={verifyingOtp}
        loading={verifyingOtp}
      />
    </ScreenLayout>
  );
}
