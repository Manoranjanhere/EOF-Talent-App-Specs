import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { PurchaseSubscriptionDto } from "./dto/purchase-subscription.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  listPlans(publishedOnly = true) {
    return this.prisma.subscriptionPlanMaster.findMany({
      where: publishedOnly ? { published: true, isActive: true } : undefined,
      orderBy: [{ isJobPostingPlan: "asc" }, { monthlyPriceInr: "asc" }]
    });
  }

  createPlan(dto: CreatePlanDto, audit: AuditData) {
    return this.prisma.subscriptionPlanMaster.create({
      data: {
        code: dto.code,
        title: dto.title,
        description: dto.description,
        targetGroupId: dto.targetGroupId,
        monthlyPriceInr: dto.monthlyPriceInr,
        validityDays: dto.validityDays,
        isJobPostingPlan: dto.isJobPostingPlan,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }

  async purchase(userId: string, dto: PurchaseSubscriptionDto, audit: AuditData) {
    const plan = await this.prisma.subscriptionPlanMaster.findUnique({
      where: { id: dto.planId }
    });
    if (!plan || !plan.isActive || !plan.published) {
      throw new NotFoundException("Plan not available");
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + plan.validityDays * 24 * 60 * 60 * 1000);
    const subscription = await this.prisma.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        purchaseType: dto.purchaseType,
        purchaseDate: now,
        originalExpiry: expiry,
        lastExpiry: expiry,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    await this.prisma.cloneAuditPurchase.create({
      data: {
        sourceTable: "user_subscription",
        sourceId: subscription.id,
        purchaseRef: dto.purchaseRef,
        payloadJson: subscription,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    return subscription;
  }

  getUserSubscriptions(userId: string) {
    return this.prisma.userSubscription.findMany({
      where: { userId, isActive: true },
      include: { plan: true },
      orderBy: { purchaseDate: "desc" }
    });
  }
}
