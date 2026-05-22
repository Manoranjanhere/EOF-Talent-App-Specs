import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput } from "react-native";
import { registerUser } from "../../services/auth.service";
import { useAuth } from "../../state/auth-context";

export function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [groupId, setGroupId] = useState("1");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const onRegister = async () => {
    try {
      setLoading(true);
      const response = await registerUser({
        fullName,
        email: email || undefined,
        mobileNumber: mobileNumber || undefined,
        password,
        groupId: Number(groupId)
      });
      auth.signIn({
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
        user: response.user
      });
    } catch (error) {
      Alert.alert("Registration failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Register</Text>
      <TextInput
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        placeholder="Mobile Number"
        value={mobileNumber}
        onChangeText={setMobileNumber}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        placeholder="Group Id (1 talent, 2 employer/agency)"
        value={groupId}
        onChangeText={setGroupId}
        keyboardType="numeric"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <Button
        title={loading ? "Registering..." : "Register"}
        onPress={onRegister}
        disabled={loading}
      />
    </ScrollView>
  );
}
