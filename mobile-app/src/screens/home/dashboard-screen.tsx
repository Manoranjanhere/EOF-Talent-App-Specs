import React from "react";
import { Button, ScrollView, Text } from "react-native";
import { useAuth } from "../../state/auth-context";

export function DashboardScreen() {
  const auth = useAuth();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>EOF Talent</Text>
      <Text>Logged in as {auth.user?.fullName}</Text>
      <Text>Roles: {(auth.user?.roles ?? []).join(", ")}</Text>
      <Button title="Logout" onPress={auth.signOut} />
    </ScrollView>
  );
}
