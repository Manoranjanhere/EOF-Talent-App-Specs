import React, { useState } from "react";
import { Alert, Text } from "react-native";
import {
  AuthScreen,
  LabeledInput,
  LinkButton,
  PrimaryButton,
  SecondaryButton,
  SegmentedControl
} from "../../components/auth-ui";
import {
  loginByEmailPassword,
  loginByMobileOtp,
  sendMobileOtp
} from "../../services/auth.service";
import { useAuth } from "../../state/auth-context";

type LoginMode = "email" | "phone";

export function LoginScreen({ navigation }: { navigation: any }) {
  const [mode, setMode] = useState<LoginMode>("email");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDebugHint, setOtpDebugHint] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const onSendOtp = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert("Missing mobile", "Please enter your mobile number.");
      return;
    }
    try {
      setSendingOtp(true);
      const response = await sendMobileOtp({
        mobileNumber: mobileNumber.trim()
      });
      setOtpSent(true);
      setOtpDebugHint(
        response.otpCode
          ? `Dev OTP: ${response.otpCode} (also printed in backend terminal)`
          : "OTP sent to your mobile number."
      );
      Alert.alert(
        "OTP sent",
        response.otpCode
          ? `Use OTP ${response.otpCode} (dev mode — no SMS yet).`
          : "Please enter the OTP to continue."
      );
    } catch (error) {
      Alert.alert("Send OTP failed", (error as Error).message);
    } finally {
      setSendingOtp(false);
    }
  };

  const onLogin = async () => {
    if (mode === "email" && !email.trim()) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }
    if (mode === "phone" && !mobileNumber.trim()) {
      Alert.alert("Missing mobile", "Please enter your mobile number.");
      return;
    }
    if (mode === "phone" && !otpSent) {
      Alert.alert("Send OTP first", "Please send OTP before signing in.");
      return;
    }
    if (mode === "phone" && otpCode.trim().length < 4) {
      Alert.alert("Invalid OTP", "Please enter the OTP you received.");
      return;
    }
    if (mode === "email" && password.length < 8) {
      Alert.alert("Invalid password", "Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      const response =
        mode === "phone"
          ? await loginByMobileOtp({
              mobileNumber: mobileNumber.trim(),
              otpCode: otpCode.trim()
            })
          : await loginByEmailPassword({
              email: email.trim(),
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
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in with email or mobile — use one method at a time."
      footer={
        <LinkButton title="Create a new account" onPress={() => navigation.navigate("Register")} />
      }
    >
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: "email", label: "Email" },
          { value: "phone", label: "Mobile OTP" }
        ]}
      />

      {mode === "email" ? (
        <>
          <LabeledInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <LabeledInput
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </>
      ) : (
        <>
          <LabeledInput
            label="Mobile number"
            placeholder="10-digit mobile number"
            value={mobileNumber}
            onChangeText={(value) => {
              setMobileNumber(value);
              setOtpSent(false);
              setOtpCode("");
              setOtpDebugHint(null);
            }}
            keyboardType="phone-pad"
          />
          <SecondaryButton
            title={sendingOtp ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
            onPress={onSendOtp}
            disabled={sendingOtp}
          />
          {otpSent ? (
            <>
              <LabeledInput
                label="OTP"
                placeholder="Enter OTP"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
              />
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                {otpDebugHint ?? "Enter the OTP sent to your mobile."}
              </Text>
            </>
          ) : (
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>
              Register with this mobile first. Dev OTP is 123456 (see backend
              terminal after Send OTP).
            </Text>
          )}
        </>
      )}

      <PrimaryButton
        title={loading ? "Signing in..." : "Sign in"}
        onPress={onLogin}
        disabled={loading}
        loading={loading}
      />
    </AuthScreen>
  );
}
