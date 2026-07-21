import { apiRequest } from "./api-client";
import { GroupId } from "@eof/shared";

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
  payload: { planId: string; purchaseType: "PAID" | "FREE" | "COMPENSATORY"; purchaseRef?: string }
) {
  return apiRequest("/subscriptions/purchase", {
    method: "POST",
    token,
    body: payload
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
