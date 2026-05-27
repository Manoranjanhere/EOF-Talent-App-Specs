import React, { useState } from "react";
import { Alert, Text } from "react-native";
import {
  Card,
  EmptyState,
  LabeledInput,
  ListCard,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton,
  SectionTitle,
  SegmentedControl,
  colors
} from "../../components/ui";
import { createAlbum, grantAlbumAccess, listAlbumGrants } from "../../services/albums.service";
import { useAuth } from "../../state/auth-context";

export function AlbumsScreen() {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [albumId, setAlbumId] = useState("");
  const [grantedToUserId, setGrantedToUserId] = useState("");
  const [grantDaysKey, setGrantDaysKey] = useState<"30" | "60" | "90">("30");
  const grantedDays = Number(grantDaysKey) as 30 | 60 | 90;
  const [grants, setGrants] = useState<any[]>([]);

  const onCreateAlbum = async () => {
    if (!accessToken || !title.trim()) return;
    try {
      const album = await createAlbum(accessToken, { title: title.trim(), visibility });
      setAlbumId((album as any).id);
      Alert.alert("Album created", `Album ID copied to access section.`);
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  const onGrantAccess = async () => {
    if (!accessToken || !albumId || !grantedToUserId) return;
    try {
      await grantAlbumAccess(accessToken, albumId, { grantedToUserId, grantedDays });
      Alert.alert("Success", "Private album access granted.");
      await onLoadGrants();
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  const onLoadGrants = async () => {
    if (!accessToken || !albumId) return;
    try {
      const result = await listAlbumGrants(accessToken, albumId);
      setGrants(result as any[]);
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  return (
    <ScreenLayout title="Photo albums" subtitle="Up to 5 albums · 9 photos + 1 video each">
      <Card>
        <SectionTitle title="Create album" />
        <LabeledInput label="Album title" value={title} onChangeText={setTitle} placeholder="Portfolio 2026" />
        <SegmentedControl
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: "PUBLIC", label: "Public" },
            { value: "PRIVATE", label: "Private" }
          ]}
        />
        <PrimaryButton title="Create album" onPress={onCreateAlbum} />
      </Card>

      <Card>
        <SectionTitle title="Private access" />
        <LabeledInput label="Album ID" value={albumId} onChangeText={setAlbumId} placeholder="Paste album UUID" />
        <LabeledInput
          label="Grant to user ID"
          value={grantedToUserId}
          onChangeText={setGrantedToUserId}
          placeholder="User UUID"
        />
        <SegmentedControl
          value={grantDaysKey}
          onChange={setGrantDaysKey}
          options={[
            { value: "30", label: "30 days" },
            { value: "60", label: "60 days" },
            { value: "90", label: "90 days" }
          ]}
        />
        <PrimaryButton title="Grant access" onPress={onGrantAccess} />
        <SecondaryButton title="Refresh access list" onPress={onLoadGrants} />
        {grants.length === 0 ? (
          <EmptyState message="No access grants loaded yet." />
        ) : (
          grants.map((grant) => (
            <ListCard
              key={grant.id}
              title={grant.grantedToUser?.fullName ?? grant.grantedToUserId}
              meta={[`Expires: ${String(grant.expiresAt)}`, grant.isActive ? "Active" : "Revoked"]}
              badge={grant.isActive ? "ACTIVE" : "OFF"}
            />
          ))
        )}
      </Card>
      <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>
        Private albums can be shared for 30, 60, or 90 days.
      </Text>
    </ScreenLayout>
  );
}
