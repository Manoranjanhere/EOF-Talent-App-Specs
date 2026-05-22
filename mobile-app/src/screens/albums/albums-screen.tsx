import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput, View } from "react-native";
import { createAlbum, grantAlbumAccess, listAlbumGrants } from "../../services/albums.service";
import { useAuth } from "../../state/auth-context";

export function AlbumsScreen() {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [albumId, setAlbumId] = useState("");
  const [grantedToUserId, setGrantedToUserId] = useState("");
  const [grantedDays, setGrantedDays] = useState<30 | 60 | 90>(30);
  const [grants, setGrants] = useState<any[]>([]);

  const onCreateAlbum = async () => {
    if (!accessToken) return;
    try {
      const album = await createAlbum(accessToken, { title, visibility });
      setAlbumId((album as any).id);
      Alert.alert("Album created", `Album ID: ${(album as any).id}`);
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  const onGrantAccess = async () => {
    if (!accessToken || !albumId) return;
    try {
      await grantAlbumAccess(accessToken, albumId, { grantedToUserId, grantedDays });
      Alert.alert("Success", "Access granted");
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
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Photo Albums</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Album title"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <Button
        title={`Visibility: ${visibility} (tap to toggle)`}
        onPress={() => setVisibility(visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC")}
      />
      <Button title="Create Album" onPress={onCreateAlbum} />

      <View style={{ marginTop: 10, gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>Private access controls</Text>
        <TextInput
          value={albumId}
          onChangeText={setAlbumId}
          placeholder="Album ID"
          style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
        />
        <TextInput
          value={grantedToUserId}
          onChangeText={setGrantedToUserId}
          placeholder="User ID to grant"
          style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
        />
        <Button
          title={`Grant days: ${grantedDays} (tap to cycle)`}
          onPress={() => setGrantedDays(grantedDays === 30 ? 60 : grantedDays === 60 ? 90 : 30)}
        />
        <Button title="Grant Access" onPress={onGrantAccess} />
        <Button title="Load Access List" onPress={onLoadGrants} />
        {grants.map((grant) => (
          <Text key={grant.id}>
            {grant.grantedToUser?.fullName ?? grant.grantedToUserId} - expires {String(grant.expiresAt)}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}
