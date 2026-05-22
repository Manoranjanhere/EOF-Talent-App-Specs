import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput, View } from "react-native";
import { loginByEmailPassword, loginByMobileOtp } from "../../services/auth.service";
import { useAuth } from "../../state/auth-context";

export function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("123456");
  const [useOtp, setUseOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const onLogin = async () => {
    try {
      setLoading(true);
      const response = useOtp
        ? await loginByMobileOtp({ mobileNumber, otpCode })
        : await loginByEmailPassword({
            email: email || undefined,
            mobileNumber: mobileNumber || undefined,
            password
          });

      auth.signIn({
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
        user: response.user
      });
    } catch (error) {
      Alert.alert("Login failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Login</Text>
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
        keyboardType="phone-pad"
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      {!useOtp && (
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
        />
      )}
      {useOtp && (
        <TextInput
          placeholder="OTP"
          value={otpCode}
          onChangeText={setOtpCode}
          style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
        />
      )}
      <Button
        title={useOtp ? "Switch to Password Login" : "Switch to Mobile OTP"}
        onPress={() => setUseOtp((prev) => !prev)}
      />
      <Button title={loading ? "Logging in..." : "Login"} onPress={onLogin} disabled={loading} />

      <View style={{ marginTop: 20 }}>
        <Button title="Create account" onPress={() => navigation.navigate("Register")} />
      </View>
    </ScrollView>
  );
}
