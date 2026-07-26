import { apiRequest } from "./api-client";
import { GroupId } from "@eof/shared";
import { purchasePlanViaPlayStore } from "./play-billing.service";

export type SubscriptionPlan = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  monthlyPriceInr: number;
  validityDays: number;
  isJobPostingPlan: boolean;
};

export type UserSubscription = {
  id: string;
  planId: string;
  purchaseType: string;
  lastExpiry: string;
  isActive: boolean;
  plan: SubscriptionPlan;
};

export function listSubscriptionPlans() {
  return apiRequest<SubscriptionPlan[]>("/subscriptions/plans");
}

export function listMySubscriptions(token: string) {
  return apiRequest<UserSubscription[]>("/subscriptions/me", { token });
}

export function purchaseSubscription(
  token: string,
  payload: {
    planId: string;
    purchaseType: "PAID" | "FREE" | "COMPENSATORY";
    purchaseRef?: string;
    googlePlayPurchaseToken?: string;
    googlePlayProductId?: string;
    googlePlayPackageName?: string;
  }
) {
  return apiRequest("/subscriptions/purchase", {
    method: "POST",
    token,
    body: payload
  });
}

/** Runs Google Play Billing, then registers the entitlement with the API. */
export async function purchasePlanWithPlayStore(
  token: string,
  plan: Pick<SubscriptionPlan, "id" | "code" | "isJobPostingPlan">
) {
  const play = await purchasePlanViaPlayStore({
    planCode: plan.code,
    isJobPostingPlan: plan.isJobPostingPlan
  });
  return purchaseSubscription(token, {
    planId: plan.id,
    purchaseType: "PAID",
    purchaseRef: play.orderId,
    googlePlayPurchaseToken: play.purchaseToken,
    googlePlayProductId: play.productId,
    googlePlayPackageName: play.packageName
  });
}

export function countAvailableJobSlots(subscriptions: UserSubscription[]) {
  const now = Date.now();
  return subscriptions.filter(
    (s) =>
      s.isActive &&
      s.plan?.isJobPostingPlan &&
      new Date(s.lastExpiry).getTime() >= now
  ).length;
}

export function messagingPlanForRoles(roles: number[]) {
  if (roles.includes(GroupId.TalentEmployerOrAgency)) return "MSG_EMPLOYER_300";
  return "MSG_MEMBER_100";
}
