declare const process: { env: Record<string, string | undefined> };

import { Platform } from "react-native";
import { playBillingBypassEnabled } from "./session-storage";

export type PlayPurchaseResult = {
  productId: string;
  purchaseToken: string;
  packageName: string;
  orderId?: string;
};

const DEFAULT_SKUS: Record<string, string> = {
  MSG_MEMBER_100: "eof_msg_member_100",
  MSG_EMPLOYER_300: "eof_msg_employer_300",
  JOB_POST_300_90: "eof_job_post_300"
};

export function playSkuForPlanCode(planCode: string): string {
  const envKey = `EXPO_PUBLIC_PLAY_SKU_${planCode}`;
  return process.env[envKey]?.trim() || DEFAULT_SKUS[planCode] || planCode.toLowerCase();
}

export function playPackageName(): string {
  return (
    process.env.EXPO_PUBLIC_PLAY_PACKAGE_NAME?.trim() ||
    "com.anonymous.eoftalentapp"
  );
}

type IapModule = {
  initConnection: () => Promise<boolean>;
  endConnection: () => Promise<void>;
  getSubscriptions: (skus: string[]) => Promise<unknown[]>;
  getProducts: (skus: string[]) => Promise<unknown[]>;
  requestSubscription: (sku: string) => Promise<PlayPurchaseLike | PlayPurchaseLike[]>;
  requestPurchase: (sku: string) => Promise<PlayPurchaseLike | PlayPurchaseLike[]>;
  finishTransaction: (purchase: PlayPurchaseLike, isConsumable?: boolean) => Promise<void>;
};

type PlayPurchaseLike = {
  productId?: string;
  productIds?: string[];
  purchaseToken?: string;
  transactionReceipt?: string;
  transactionId?: string;
  packageNameAndroid?: string;
};

function loadIap(): IapModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-iap");
    return (mod.default ?? mod) as IapModule;
  } catch {
    return null;
  }
}

function normalizePurchase(
  raw: PlayPurchaseLike | PlayPurchaseLike[],
  expectedSku: string
): PlayPurchaseResult {
  const purchase = Array.isArray(raw) ? raw[0] : raw;
  const productId = purchase?.productId || purchase?.productIds?.[0] || expectedSku;
  const purchaseToken = purchase?.purchaseToken || purchase?.transactionReceipt;
  if (!purchaseToken) {
    throw new Error("Play Store did not return a purchase token.");
  }
  return {
    productId,
    purchaseToken,
    packageName: purchase?.packageNameAndroid || playPackageName(),
    orderId: purchase?.transactionId
  };
}

/**
 * Purchase a plan via Google Play Billing.
 * Job posting plans are one-time products; messaging plans are subscriptions.
 * When EXPO_PUBLIC_PLAY_BILLING_BYPASS=true (dev/staging), returns a bypass token
 * that the API accepts only if PLAY_BILLING_BYPASS is also enabled server-side.
 */
export async function purchasePlanViaPlayStore(input: {
  planCode: string;
  isJobPostingPlan: boolean;
}): Promise<PlayPurchaseResult> {
  const productId = playSkuForPlanCode(input.planCode);

  if (playBillingBypassEnabled()) {
    return {
      productId,
      purchaseToken: `dev-bypass:${input.planCode}:${Date.now()}`,
      packageName: playPackageName(),
      orderId: `dev-${Date.now()}`
    };
  }

  if (Platform.OS !== "android") {
    throw new Error("Subscriptions are billed through Google Play on Android.");
  }

  const iap = loadIap();
  if (!iap) {
    throw new Error(
      "Google Play Billing is not linked in this build. Install react-native-iap, add Play Console products, and rebuild the Android app."
    );
  }

  await iap.initConnection();
  try {
    if (input.isJobPostingPlan) {
      await iap.getProducts([productId]);
      const result = await iap.requestPurchase(productId);
      const purchase = normalizePurchase(result, productId);
      await iap.finishTransaction(
        Array.isArray(result) ? result[0] : result,
        true
      );
      return purchase;
    }

    await iap.getSubscriptions([productId]);
    const result = await iap.requestSubscription(productId);
    const purchase = normalizePurchase(result, productId);
    await iap.finishTransaction(Array.isArray(result) ? result[0] : result, false);
    return purchase;
  } finally {
    try {
      await iap.endConnection();
    } catch {
      // ignore
    }
  }
}
