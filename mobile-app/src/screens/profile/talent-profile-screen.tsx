import React, { useEffect, useState } from "react";
import { Alert, ActivityIndicator, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CachedMediaImage } from "../../components/cached-media-image";
import { ImageLightbox } from "../../components/image-lightbox";
import {
  Card,
  LabeledInput,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle,
  SegmentedControl
} from "../../components/ui";
import {
  getProfile,
  listPublishedTags,
  setProfileTags,
  updateTalentProfile,
  uploadProfilePhoto
} from "../../services/profile.service";
import { mediaUrl } from "../../services/albums.service";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";
import type { GenderValue } from "../../constants/gender";
import { GENDER_OPTIONS, normalizeGender } from "../../constants/gender";

type TagOption = { id: string; slug: string; title: string };

function toggleId(list: string[], id: string, max: number): string[] {
  if (list.includes(id)) {
    return list.filter((item) => item !== id);
  }
  if (list.length >= max) {
    return list;
  }
  return [...list, id];
}

export function TalentProfileScreen({ navigation }: { navigation?: any }) {
  const { accessToken, user } = useAuth();
  const { colors } = useTheme();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<GenderValue>("Male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [snapchatUrl, setSnapchatUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [miniBio, setMiniBio] = useState("");
  const [isAvailable, setIsAvailable] = useState<"yes" | "no">("yes");
  const [tags, setTags] = useState<TagOption[]>([]);
  const [primaryTagIds, setPrimaryTagIds] = useState<string[]>([]);
  const [secondaryTagIds, setSecondaryTagIds] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [hasProfilePhoto, setHasProfilePhoto] = useState(false);
  const [ratingAverage, setRatingAverage] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [photoCacheKey, setPhotoCacheKey] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [accessToken, user?.id]);

  const load = async () => {
    if (!accessToken || !user?.id) return;
    try {
      const [tagList, profile] = await Promise.all([
        listPublishedTags(),
        getProfile(user.id, accessToken)
      ]);
      setTags(tagList);
      const p = profile as any;
      setFullName(p.fullName ?? "");
      setAge(p.age != null ? String(p.age) : "");
      setGender(normalizeGender(p.gender) || "Male");
      setHeightCm(p.heightCm != null ? String(p.heightCm) : "");
      setWeightKg(p.weightKg != null ? String(p.weightKg) : "");
      setCity(p.city ?? "");
      setCountry(p.country ?? "");
      setInstagramUrl(p.instagramUrl ?? "");
      setSnapchatUrl(p.snapchatUrl ?? "");
      setYoutubeUrl(p.youtubeUrl ?? "");
      setTiktokUrl(p.tiktokUrl ?? "");
      setMiniBio(p.miniBio ?? "");
      setIsAvailable(p.isAvailable === false ? "no" : "yes");
      setHasProfilePhoto(Boolean(p.profilePhotoAssetId));
      const existingPhoto = mediaUrl(p.profilePhotoUrl);
      if (existingPhoto) {
        setPhotoUri(existingPhoto);
        setPhotoCacheKey(p.profilePhotoObjectKey ?? null);
      }
      setRatingAverage(Number(p.ratingAverage ?? 0));
      setRatingCount(Number(p.ratingCount ?? 0));
      const links = (p.profileTags ?? []) as Array<{
        tagId: string;
        linkType: "PRIMARY" | "SECONDARY";
      }>;
      setPrimaryTagIds(
        links.filter((l) => l.linkType === "PRIMARY").map((l) => l.tagId)
      );
      setSecondaryTagIds(
        links.filter((l) => l.linkType === "SECONDARY").map((l) => l.tagId)
      );
    } catch (error) {
      Alert.alert("Load failed", (error as Error).message);
    }
  };

  const onPickPhoto = async () => {
    if (!accessToken) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload a profile photo.");
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
    const mimeType = asset.mimeType ?? "image/jpeg";
    setPhotoUri(asset.uri);
    setPhotoCacheKey(asset.uri);

    try {
      setUploadingPhoto(true);
      await uploadProfilePhoto(accessToken, asset.uri, mimeType);
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
    if (!fullName.trim()) {
      Alert.alert("Missing name", "Please enter your name.");
      return;
    }
    if (!hasProfilePhoto) {
      Alert.alert("Profile photo required", "Upload at least one profile photo before saving.");
      return;
    }
    if (!gender) {
      Alert.alert("Select gender", "Choose Male or Female.");
      return;
    }
    if (primaryTagIds.length === 0) {
      Alert.alert("Select tags", "Choose at least one primary skill tag.");
      return;
    }

    try {
      setLoading(true);
      await updateTalentProfile(accessToken, {
        fullName: fullName.trim(),
        age: age ? Number(age) : undefined,
        gender,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        snapchatUrl: snapchatUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        tiktokUrl: tiktokUrl.trim() || undefined,
        miniBio: miniBio.trim() || undefined,
        isAvailable: isAvailable === "yes"
      });
      await setProfileTags(accessToken, { primaryTagIds, secondaryTagIds });
      if (navigation) {
        navigation.navigate("ProfileHub", { profileUpdated: true });
      } else {
        Alert.alert("Saved", "Your talent profile was updated.");
      }
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="Edit profile"
      subtitle="Photo required · skills · looking for work"
      footer={
        navigation ? (
          <SecondaryButton title="Back to profile" onPress={() => navigation.goBack()} />
        ) : undefined
      }
    >
      <Card>
        <SectionTitle title="Profile photo (required)" />
        {photoUri ? (
          <Pressable onPress={() => !uploadingPhoto && setPreviewUri(photoUri)}>
            <View
              style={{
                width: 128,
                height: 128,
                borderRadius: 64,
                borderWidth: 2,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
                overflow: "hidden",
                backgroundColor: colors.primarySoft
              }}
            >
              <View style={{ width: 120, height: 120, borderRadius: 60, overflow: "hidden" }}>
                <CachedMediaImage
                  uri={photoUri}
                  cacheKey={photoCacheKey}
                  style={{ width: 120, height: 120, opacity: uploadingPhoto ? 0.55 : 1 }}
                />
              </View>
              {uploadingPhoto ? (
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    borderRadius: 64,
                    backgroundColor: "rgba(0,0,0,0.35)",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <ActivityIndicator color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 11, marginTop: 6 }}>Uploading…</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ) : (
          <Text style={{ color: colors.muted, marginBottom: 8 }}>
            {hasProfilePhoto
              ? "A profile photo is already on file. You can replace it."
              : "Upload at least one profile photo (stored in S3)."}
          </Text>
        )}
        <SecondaryButton
          title={uploadingPhoto ? "Uploading..." : "Choose / upload photo"}
          onPress={onPickPhoto}
          disabled={uploadingPhoto}
        />
      </Card>

      <Card>
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
      </Card>

      <Card>
        <SectionTitle title="Job availability" />
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10, lineHeight: 19 }}>
          Show employers whether you are open to new work opportunities.
        </Text>
        <SegmentedControl
          value={isAvailable}
          onChange={setIsAvailable}
          options={[
            { value: "yes", label: "Looking for work" },
            { value: "no", label: "Not looking" }
          ]}
        />
      </Card>

      <Card>
        <SectionTitle title="Social links (optional)" />
        <LabeledInput
          label="Instagram"
          value={instagramUrl}
          onChangeText={setInstagramUrl}
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
      </Card>

      <Card>
        <SectionTitle title="Primary skills (max 5)" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {tags.map((tag) => {
            const selected = primaryTagIds.includes(tag.id);
            const disabled = secondaryTagIds.includes(tag.id);
            return (
              <Pressable
                key={`p-${tag.id}`}
                disabled={disabled}
                onPress={() =>
                  setPrimaryTagIds((prev) => toggleId(prev, tag.id, 5))
                }
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
      </Card>

      <Card>
        <SectionTitle title="Secondary skills (max 5)" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {tags.map((tag) => {
            const selected = secondaryTagIds.includes(tag.id);
            const disabled = primaryTagIds.includes(tag.id);
            return (
              <Pressable
                key={`s-${tag.id}`}
                disabled={disabled}
                onPress={() =>
                  setSecondaryTagIds((prev) => toggleId(prev, tag.id, 5))
                }
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
      </Card>

      <Card>
        <SectionTitle title="About you" />
        <LabeledInput
          label="Mini bio"
          value={miniBio}
          onChangeText={setMiniBio}
          placeholder="Tell employers about your experience..."
          multiline
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 10 }}>
          Rating: {ratingAverage.toFixed(1)}/5 ({ratingCount} ratings · employers only)
        </Text>
        <PrimaryButton
          title={loading ? "Saving..." : "Save profile"}
          onPress={onSave}
          loading={loading}
          disabled={loading || uploadingPhoto}
        />
      </Card>

      <ImageLightbox
        uri={previewUri}
        cacheKey={photoCacheKey}
        visible={Boolean(previewUri)}
        onClose={() => setPreviewUri(null)}
      />
    </ScreenLayout>
  );
}
