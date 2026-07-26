import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PurchaseType } from "@prisma/client";
import { GroupId } from "@eof/shared";
import { PrismaService } from "../../database/prisma.service";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { PurchaseSubscriptionDto } from "./dto/purchase-subscription.dto";
import { PlayBillingService } from "./play-billing.service";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly playBilling: PlayBillingService
  ) {}

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

    let purchaseRef = dto.purchaseRef?.trim() || undefined;

    if (dto.purchaseType === PurchaseType.PAID) {
      const expectedSku = this.playBilling.playProductIdForPlanCode(plan.code);
      const productId = dto.googlePlayProductId?.trim() || expectedSku;
      if (!productId) {
        throw new BadRequestException(
          `No Play Store SKU mapped for plan ${plan.code}. Set PLAY_SKU_${plan.code}.`
        );
      }
      if (expectedSku && productId !== expectedSku) {
        throw new BadRequestException("Play product id does not match this plan");
      }
      if (!dto.googlePlayPurchaseToken?.trim()) {
        throw new BadRequestException(
          "Paid plans must be purchased through Google Play. Missing purchase token."
        );
      }

      const verified = await this.playBilling.verifyPaidPurchase({
        productId,
        purchaseToken: dto.googlePlayPurchaseToken.trim(),
        packageName: dto.googlePlayPackageName,
        kind: plan.isJobPostingPlan ? "product" : "subscription"
      });
      purchaseRef = verified.orderId;
    } else if (
      dto.purchaseType === PurchaseType.FREE ||
      dto.purchaseType === PurchaseType.COMPENSATORY
    ) {
      const isAdmin = await this.prisma.userRoleLink.findFirst({
        where: {
          userId,
          isActive: true,
          groupId: { in: [GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin] }
        }
      });
      // Seed grants FREE messaging to talent via seed script (admin context).
      // Runtime FREE/COMPENSATORY from the mobile app is admin-only.
      if (!isAdmin) {
        throw new ForbiddenException(
          "Only admins can grant FREE or COMPENSATORY subscriptions. Use Google Play for paid plans."
        );
      }
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
        purchaseRef: purchaseRef,
        payloadJson: {
          ...subscription,
          googlePlayProductId: dto.googlePlayProductId,
          googlePlayPackageName: dto.googlePlayPackageName
        },
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
