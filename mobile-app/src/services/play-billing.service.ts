declare const process: { env: Record<string, string | undefined> };

import { Platform } from "react-native";
import { playBillingBypassEnabled } from "./session-storage";

export type PlayPurchaseResult = {
  productId: string;
  purchaseToken: string;
  packageName: string;
  orderId?: string;
  /** Native purchase object — used to acknowledge/consume after the API succeeds. */
  rawPurchase?: PlayPurchaseLike;
  isConsumable?: boolean;
};

const DEFAULT_SKUS: Record<string, string> = {
  MSG_MEMBER_100: "eof_msg_member_100",
  MSG_EMPLOYER_300: "eof_msg_employer_300",
  TALENT_SERIOUS_JOB_200: "eof_talent_serious_200",
  JOB_POST_100_90: "eof_job_post_100",
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

type SubscriptionOfferLike = {
  offerToken?: string;
  basePlanId?: string;
};

type SubscriptionLike = {
  productId?: string;
  subscriptionOfferDetails?: SubscriptionOfferLike[];
};

type PlayPurchaseLike = {
  productId?: string;
  productIds?: string[];
  purchaseToken?: string;
  transactionReceipt?: string;
  transactionId?: string;
  packageNameAndroid?: string;
  purchaseStateAndroid?: number;
  isAcknowledgedAndroid?: boolean;
};

type EmitterSub = { remove: () => void };

type IapModule = {
  initConnection: () => Promise<boolean>;
  endConnection: () => Promise<void>;
  getSubscriptions: (opts: { skus: string[] }) => Promise<SubscriptionLike[]>;
  getProducts: (opts: { skus: string[] }) => Promise<unknown[]>;
  getAvailablePurchases: () => Promise<PlayPurchaseLike[]>;
  requestSubscription: (opts: {
    subscriptionOffers: { sku: string; offerToken: string }[];
  }) => Promise<PlayPurchaseLike | PlayPurchaseLike[] | void | null>;
  requestPurchase: (opts: { skus: string[] }) => Promise<
    PlayPurchaseLike | PlayPurchaseLike[] | void | null
  >;
  finishTransaction: (opts: {
    purchase: PlayPurchaseLike;
    isConsumable?: boolean;
  }) => Promise<unknown>;
  purchaseUpdatedListener: (cb: (purchase: PlayPurchaseLike) => void) => EmitterSub;
  purchaseErrorListener: (cb: (error: { message?: string; code?: string }) => void) => EmitterSub;
};

function loadIap(): IapModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-iap") as { default?: IapModule } & Partial<IapModule>;
    const src = (typeof mod.initConnection === "function" ? mod : mod.default) as
      | IapModule
      | undefined;
    if (typeof src?.initConnection !== "function") return null;
    return src;
  } catch {
    return null;
  }
}

function firstPurchase(
  raw: PlayPurchaseLike | PlayPurchaseLike[] | void | null
): PlayPurchaseLike | undefined {
  if (!raw) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

function purchaseTokenOf(purchase?: PlayPurchaseLike): string | undefined {
  return purchase?.purchaseToken || purchase?.transactionReceipt || undefined;
}

function matchesSku(purchase: PlayPurchaseLike | undefined, sku: string): boolean {
  if (!purchase) return false;
  return purchase.productId === sku || Boolean(purchase.productIds?.includes(sku));
}

function mapPlayError(error: unknown): Error {
  const err = error as { message?: string; code?: string; debugMessage?: string };
  const code = err?.code || "";
  const msg = err?.message || err?.debugMessage || String(error);

  if (code === "E_USER_CANCELLED" || /user cancelled|canceled/i.test(msg)) {
    return new Error("Purchase cancelled.");
  }
  if (code === "E_ITEM_UNAVAILABLE" || /item unavailable/i.test(msg)) {
    return new Error(
      "This product is not available in Google Play. Add the SKU in Play Console, publish Internal testing, and install from Play (license tester) — sideloaded APKs usually cannot complete billing."
    );
  }
  if (code === "E_ALREADY_OWNED") {
    return new Error(
      "Google Play says you already own this. Close the Play sheet and try again — we will restore the existing purchase."
    );
  }
  if (code === "E_SERVICE_ERROR" || code === "E_IAP_NOT_AVAILABLE" || /billing.*unavailable/i.test(msg)) {
    return new Error(
      "Google Play Billing is not available on this install. Use an Internal testing build signed with the Play upload key."
    );
  }
  if (/subscriptionOffers are required|"skus" is required|skus is required/i.test(msg)) {
    return new Error("Play Billing is misconfigured in this app build. Update the app and try again.");
  }
  return new Error(msg);
}

function normalizePurchase(purchase: PlayPurchaseLike, expectedSku: string): PlayPurchaseResult {
  const productId = purchase.productId || purchase.productIds?.[0] || expectedSku;
  const purchaseToken = purchaseTokenOf(purchase);
  if (!purchaseToken) {
    throw new Error("Play Store did not return a purchase token.");
  }
  return {
    productId,
    purchaseToken,
    packageName: purchase.packageNameAndroid || playPackageName(),
    orderId: purchase.transactionId,
    rawPurchase: purchase,
    isConsumable: false
  };
}

async function waitForPlayPurchase(
  iap: IapModule,
  expectedSku: string,
  start: () => Promise<PlayPurchaseLike | PlayPurchaseLike[] | void | null>
): Promise<PlayPurchaseLike> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const succeed = (purchase: PlayPurchaseLike) => {
      if (settled || !purchaseTokenOf(purchase)) return;
      settled = true;
      cleanup();
      resolve(purchase);
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(mapPlayError(error));
    };

    const updated = iap.purchaseUpdatedListener((purchase) => {
      if (!matchesSku(purchase, expectedSku) && purchase.productId) return;
      succeed(purchase);
    });
    const errored = iap.purchaseErrorListener((error) => fail(error));
    const timer = setTimeout(() => {
      fail(new Error("Play Store timed out. Try again."));
    }, 120000);

    function cleanup() {
      clearTimeout(timer);
      try {
        updated.remove();
      } catch {
        // ignore
      }
      try {
        errored.remove();
      } catch {
        // ignore
      }
    }

    Promise.resolve()
      .then(start)
      .then((raw) => {
        const purchase = firstPurchase(raw);
        if (purchase && purchaseTokenOf(purchase)) succeed(purchase);
      })
      .catch(fail);
  });
}

async function restoreOwnedPurchase(
  iap: IapModule,
  productId: string
): Promise<PlayPurchaseLike | undefined> {
  try {
    const owned = await iap.getAvailablePurchases();
    return owned.find((p) => matchesSku(p, productId) && purchaseTokenOf(p));
  } catch {
    return undefined;
  }
}

async function buyOnPlay(
  iap: IapModule,
  productId: string,
  isJobPostingPlan: boolean
): Promise<PlayPurchaseLike> {
  const restored = await restoreOwnedPurchase(iap, productId);
  if (restored) return restored;

  if (isJobPostingPlan) {
    const products = await iap.getProducts({ skus: [productId] });
    if (!products?.length) {
      throw new Error(
        `Play Store has no in-app product "${productId}". Create it as a one-time product in Play Console Internal testing.`
      );
    }
    return waitForPlayPurchase(iap, productId, () => iap.requestPurchase({ skus: [productId] }));
  }

  const subscriptions = await iap.getSubscriptions({ skus: [productId] });
  const sub = subscriptions.find((item) => item.productId === productId) || subscriptions[0];
  const offerToken = sub?.subscriptionOfferDetails?.find((offer) => offer.offerToken)?.offerToken;
  if (!offerToken) {
    throw new Error(
      `Play Store has no subscription offer for "${productId}". Add a base plan in Play Console and wait a few hours for it to activate.`
    );
  }
  return waitForPlayPurchase(iap, productId, () =>
    iap.requestSubscription({
      subscriptionOffers: [{ sku: productId, offerToken }]
    })
  );
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
      orderId: `dev-${Date.now()}`,
      isConsumable: input.isJobPostingPlan
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
    const raw = await buyOnPlay(iap, productId, input.isJobPostingPlan);
    const purchase = normalizePurchase(raw, productId);
    purchase.isConsumable = input.isJobPostingPlan;
    return purchase;
  } catch (error) {
    throw mapPlayError(error);
  } finally {
    try {
      await iap.endConnection();
    } catch {
      // ignore
    }
  }
}

/** Acknowledge/consume after the backend has recorded the entitlement. */
export async function acknowledgePlayPurchase(play: PlayPurchaseResult): Promise<void> {
  if (!play.rawPurchase || playBillingBypassEnabled()) return;
  const iap = loadIap();
  if (!iap) return;

  const purchase: PlayPurchaseLike = {
    ...play.rawPurchase,
    purchaseToken: play.purchaseToken,
    productId: play.productId,
    // finishTransaction on Android requires PURCHASED (1) if the field is present.
    purchaseStateAndroid: play.rawPurchase.purchaseStateAndroid ?? 1,
    isAcknowledgedAndroid: play.rawPurchase.isAcknowledgedAndroid ?? false
  };

  await iap.initConnection();
  try {
    await iap.finishTransaction({
      purchase,
      isConsumable: Boolean(play.isConsumable)
    });
  } catch {
    // Already acknowledged/consumed is fine.
  } finally {
    try {
      await iap.endConnection();
    } catch {
      // ignore
    }
  }
}
