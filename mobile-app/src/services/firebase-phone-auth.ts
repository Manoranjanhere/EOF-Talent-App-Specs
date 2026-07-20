declare const process: { env: Record<string, string | undefined> };

type ConfirmationResult = {
  confirm: (code: string) => Promise<{ user: FirebaseUser | null } | null>;
};

type FirebaseUser = {
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  phoneNumber: string | null;
};

type AuthModule = {
  (): {
    signInWithPhoneNumber: (phone: string) => Promise<ConfirmationResult>;
    currentUser: FirebaseUser | null;
  };
};

/** Normalize to E.164. Defaults to India (+91) for 10-digit local numbers. */
export function toE164(mobile: string, defaultCountryCode = "91"): string {
  const raw = mobile.trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    throw new Error("Enter a valid mobile number.");
  }
  if (raw.startsWith("+")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+${defaultCountryCode}${digits}`;
  }
  if (digits.startsWith(defaultCountryCode) && digits.length === 12) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

function loadAuth(): AuthModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@react-native-firebase/auth");
    return (mod.default ?? mod) as AuthModule;
  } catch {
    return null;
  }
}

export function isFirebasePhoneAuthAvailable(): boolean {
  try {
    const auth = loadAuth();
    return typeof auth === "function" && Boolean(auth());
  } catch {
    return false;
  }
}

/** Real Firebase SMS unless EXPO_PUBLIC_OTP_TEST_BYPASS=true */
export function useFirebasePhoneAuth(): boolean {
  const bypass = process.env.EXPO_PUBLIC_OTP_TEST_BYPASS;
  if (bypass && ["true", "1", "yes"].includes(bypass.toLowerCase())) {
    return false;
  }
  return isFirebasePhoneAuthAvailable();
}

let confirmation: ConfirmationResult | null = null;
let lastE164: string | null = null;

export async function sendFirebaseOtp(mobile: string): Promise<{ e164: string }> {
  const auth = loadAuth();
  if (!auth) {
    throw new Error(
      "Firebase Auth is not available. Rebuild the app (npm run android) with google-services.json."
    );
  }
  const e164 = toE164(mobile);
  confirmation = await auth().signInWithPhoneNumber(e164);
  lastE164 = e164;
  return { e164 };
}

export async function confirmFirebaseOtp(code: string): Promise<{
  firebaseIdToken: string;
  e164: string;
}> {
  if (!confirmation) {
    throw new Error("Send OTP first.");
  }
  const trimmed = code.trim();
  if (trimmed.length < 4) {
    throw new Error("Enter the OTP from SMS.");
  }

  const auth = loadAuth();
  if (!auth) {
    throw new Error("Firebase Auth is not available.");
  }

  const credential = await confirmation.confirm(trimmed);
  const user = credential?.user ?? auth().currentUser;
  if (!user) {
    throw new Error("Phone verification failed. Try sending OTP again.");
  }

  const firebaseIdToken = await user.getIdToken(true);
  const e164 = lastE164 ?? user.phoneNumber ?? "";
  if (!e164) {
    throw new Error("Could not read verified phone number.");
  }

  confirmation = null;
  return { firebaseIdToken, e164 };
}

export function clearFirebaseOtpSession() {
  confirmation = null;
  lastE164 = null;
}

export function mapFirebaseAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  const message = (error as Error)?.message ?? "Phone verification failed.";
  const native = String(
    (error as { nativeErrorMessage?: string; userInfo?: { message?: string } })
      ?.nativeErrorMessage ??
      (error as { userInfo?: { message?: string } })?.userInfo?.message ??
      ""
  );
  const combined = `${code} ${message} ${native}`.toUpperCase();
  const detail = [code, message, native].filter(Boolean).join(" — ");

  if (
    combined.includes("BILLING_NOT_ENABLED") ||
    combined.includes("BILLING NOT ENABLED")
  ) {
    return (
      "Firebase still reports BILLING_NOT_ENABLED for real SMS.\n\n" +
      "Even if Blaze shows upgraded:\n" +
      "1. Google Cloud Console → Billing → confirm eof-event is LINKED\n" +
      "2. Firebase → Usage and billing → confirm Blaze (not Spark)\n" +
      "3. Wait up to a few hours after linking, then retry\n" +
      "4. Test numbers never use SMS — only real numbers hit billing\n\n" +
      `Raw: ${detail}`
    );
  }

  if (
    combined.includes("CAPTCHA") ||
    combined.includes("MISSING_CLIENT_IDENTIFIER") ||
    combined.includes("APP_NOT_AUTHORIZED") ||
    code === "auth/missing-client-identifier" ||
    code === "auth/app-not-authorized"
  ) {
    return (
      "Android app verification failed for real SMS.\n\n" +
      "Firebase → Project settings → Your apps → Android\n" +
      "Add debug SHA-1 (and SHA-256), then wait a few minutes and rebuild.\n\n" +
      `Raw: ${detail}`
    );
  }

  switch (code) {
    case "auth/operation-not-allowed":
      return (
        "Phone OTP blocked for this Firebase project.\n\n" +
        "Check SMS region policy is Allow + India (IN) saved,\n" +
        "and Authentication → Sign-in method → Phone is Enabled.\n\n" +
        `Raw: ${detail}`
      );
    case "auth/invalid-phone-number":
      return "Invalid phone number. Use a valid 10-digit Indian number.";
    case "auth/too-many-requests":
      return "Too many OTP requests. Wait a bit and try again.";
    case "auth/quota-exceeded":
      return "SMS quota exceeded for this Firebase project.";
    case "auth/invalid-verification-code":
      return "Incorrect OTP. Check the SMS and try again.";
    case "auth/session-expired":
      return "OTP session expired. Send OTP again.";
    case "auth/missing-client-identifier":
      return "Add your debug SHA-1 in Firebase Console, then rebuild the app.";
    case "auth/app-not-authorized":
      return "App not authorized. Check package name and SHA-1 in Firebase.";
    default:
      return detail || message;
  }
}
  