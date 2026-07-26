import React, { useState } from "react";
import { Alert } from "react-native";
import {
  LabeledInput,
  LinkButton,
  PrimaryButton,
  ScreenLayout,
  SegmentedControl
} from "../../components/ui";
import { ThemeToggleButton } from "../../components/theme-toggle-button";
import { loginByEmailPassword } from "../../services/auth.service";
import { toE164 } from "../../services/firebase-phone-auth";
import { useAuth } from "../../state/auth-context";

type LoginMode = "email" | "phone";

export function LoginScreen({ navigation }: { navigation: any }) {
  const [mode, setMode] = useState<LoginMode>("email");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const onLogin = async () => {
    if (mode === "email" && !email.trim()) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }
    if (mode === "phone" && !mobileNumber.trim()) {
      Alert.alert("Missing mobile", "Please enter your mobile number.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Invalid password", "Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      const response = await loginByEmailPassword(
        mode === "email"
          ? { email: email.trim(), password }
          : { mobileNumber: toE164(mobileNumber.trim()), password }
      );
      await auth.signIn({
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
    <ScreenLayout
      title="Welcome back"
      subtitle="Sign in with email or phone — password only."
      headerRight={<ThemeToggleButton />}
      footer={
        <>
          <LinkButton title="Create a new account" onPress={() => navigation.navigate("Register")} />
          <LinkButton title="Privacy Policy" onPress={() => navigation.navigate("PrivacyPolicy")} />
          <LinkButton title="Terms of Service" onPress={() => navigation.navigate("TermsOfService")} />
        </>
      }
    >
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: "email", label: "Email" },
          { value: "phone", label: "Phone" }
        ]}
      />

      {mode === "email" ? (
        <LabeledInput
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      ) : (
        <LabeledInput
          label="Mobile number"
          placeholder="10-digit mobile number"
          value={mobileNumber}
          onChangeText={setMobileNumber}
          keyboardType="phone-pad"
        />
      )}

      <LabeledInput
        label="Password"
        placeholder="Your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <LinkButton
        title="Forgot password?"
        onPress={() => navigation.navigate("ForgotPassword")}
      />

      <PrimaryButton
        title={loading ? "Signing in..." : "Sign in"}
        onPress={onLogin}
        disabled={loading}
        loading={loading}
      />
    </ScreenLayout>
  );
}
