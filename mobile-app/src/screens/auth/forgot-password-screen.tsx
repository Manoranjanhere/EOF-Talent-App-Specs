import React, { useState } from "react";
import { Alert, Text } from "react-native";
import {
  LabeledInput,
  LinkButton,
  PrimaryButton,
  ScreenLayout,
  SecondaryButton
} from "../../components/ui";
import { ThemeToggleButton } from "../../components/theme-toggle-button";
import {
  resetPassword,
  sendPasswordResetOtp
} from "../../services/auth.service";
import {
  clearFirebaseOtpSession,
  confirmFirebaseOtp,
  mapFirebaseAuthError,
  sendFirebaseOtp,
  toE164,
  useFirebasePhoneAuth
} from "../../services/firebase-phone-auth";
import { useAuth } from "../../state/auth-context";
import { useTheme } from "../../theme/theme-context";

export function ForgotPasswordScreen({ navigation }: { navigation: any }) {
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [usingFirebase, setUsingFirebase] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const { colors } = useTheme();

  const onSendOtp = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert("Missing mobile", "Please enter your registered mobile number.");
      return;
    }

    try {
      setSendingOtp(true);
      const e164 = toE164(mobileNumber.trim());
      const firebaseOn = useFirebasePhoneAuth();
      setUsingFirebase(firebaseOn);

      // Confirms the mobile is registered (and returns dev OTP when bypass is on).
      const response = await sendPasswordResetOtp({ mobileNumber: e164 });

      if (firebaseOn && !response.otpCode) {
        await sendFirebaseOtp(mobileNumber.trim());
        setOtpSent(true);
        setOtpHint(`SMS sent to ${e164}. Enter the code from your messages.`);
        Alert.alert("OTP sent", `Check SMS on ${e164}`);
        return;
      }

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

  const onReset = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert("Missing mobile", "Please enter your registered mobile number.");
      return;
    }
    if (!otpSent || otpCode.trim().length < 4) {
      Alert.alert("Verify phone", "Send and enter the phone OTP first.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Password mismatch", "Password and confirm password must match.");
      return;
    }

    try {
      setLoading(true);
      const e164 = toE164(mobileNumber.trim());
      let firebaseIdToken: string | undefined;
      let otpForApi: string | undefined = otpCode.trim();

      if (usingFirebase) {
        const confirmed = await confirmFirebaseOtp(otpCode.trim());
        firebaseIdToken = confirmed.firebaseIdToken;
        otpForApi = undefined;
      }

      const response = await resetPassword({
        mobileNumber: e164,
        newPassword,
        firebaseIdToken,
        otpCode: otpForApi
      });

      await auth.signIn({
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
        user: response.user
      });
      Alert.alert("Password updated", "You are signed in with your new password.");
    } catch (error) {
      Alert.alert("Reset failed", mapFirebaseAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="Forgot password"
      subtitle="Verify your mobile with OTP, then set a new password."
      headerRight={<ThemeToggleButton />}
      footer={
        <LinkButton title="Back to sign in" onPress={() => navigation.goBack()} />
      }
    >
      <LabeledInput
        label="Mobile number"
        placeholder="Registered 10-digit mobile"
        value={mobileNumber}
        onChangeText={(value) => {
          setMobileNumber(value);
          setOtpSent(false);
          setOtpCode("");
          setOtpHint(null);
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
            onChangeText={setOtpCode}
            keyboardType="number-pad"
          />
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {otpHint ?? "Enter the OTP from your SMS."}
          </Text>

          <LabeledInput
            label="New password"
            placeholder="Minimum 8 characters"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <LabeledInput
            label="Confirm new password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <PrimaryButton
            title={loading ? "Updating..." : "Reset password"}
            onPress={onReset}
            disabled={loading}
            loading={loading}
          />
        </>
      ) : (
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          OTP is sent to your registered mobile. The OTP box appears after it is
          sent.
        </Text>
      )}
    </ScreenLayout>
  );
}
