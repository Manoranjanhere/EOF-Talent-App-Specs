import React, { useState } from "react";
import { Alert, Text } from "react-native";
import { GroupId } from "@eof/shared";
import {
  AuthScreen,
  LabeledInput,
  LinkButton,
  PrimaryButton,
  RoleSelector,
  SegmentedControl
} from "../../components/auth-ui";
import { registerUser } from "../../services/auth.service";
import { useAuth } from "../../state/auth-context";

type ContactMode = "email" | "phone";

export function RegisterScreen({ navigation }: { navigation: any }) {
  const [contactMode, setContactMode] = useState<ContactMode>("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [groupId, setGroupId] = useState<number>(GroupId.Talent);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const onRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert("Missing name", "Please enter your full name.");
      return;
    }
    if (contactMode === "email" && !email.trim()) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }
    if (contactMode === "phone" && !mobileNumber.trim()) {
      Alert.alert("Missing mobile", "Please enter your mobile number.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      const response = await registerUser({
        fullName: fullName.trim(),
        email: contactMode === "email" ? email.trim() : undefined,
        mobileNumber: contactMode === "phone" ? mobileNumber.trim() : undefined,
        password,
        groupId
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
    <AuthScreen
      title="Create account"
      subtitle="Choose your role and sign up with email or mobile."
      footer={
        <LinkButton title="Already have an account? Sign in" onPress={() => navigation.goBack()} />
      }
    >
      <RoleSelector value={groupId} onChange={setGroupId} />

      <LabeledInput
        label="Full name"
        placeholder="Your name"
        value={fullName}
        onChangeText={setFullName}
      />

      <SegmentedControl
        value={contactMode}
        onChange={setContactMode}
        options={[
          { value: "email", label: "Email" },
          { value: "phone", label: "Mobile" }
        ]}
      />

      {contactMode === "email" ? (
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
        placeholder="Minimum 8 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text style={{ color: "#94a3b8", fontSize: 12, lineHeight: 18 }}>
        Use either email or mobile for login — not both required at signup.
      </Text>

      <PrimaryButton
        title={loading ? "Creating account..." : "Create account"}
        onPress={onRegister}
        disabled={loading}
        loading={loading}
      />
    </AuthScreen>
  );
}
