import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GroupId } from "@eof/shared";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SubscriptionsService } from "./subscriptions.service";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { PurchaseSubscriptionDto } from "./dto/purchase-subscription.dto";

@ApiTags("subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get("plans")
  listPlans(@Query("all") all?: string) {
    return this.subscriptionsService.listPlans(all !== "1");
  }

  @Post("plans")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  createPlan(
    @Body() dto: CreatePlanDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.subscriptionsService.createPlan(dto, audit);
  }

  @Post("purchase")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  purchase(
    @CurrentUser() user: { userId: string },
    @Body() dto: PurchaseSubscriptionDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.subscriptionsService.purchase(user.userId, dto, audit);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mySubscriptions(@CurrentUser() user: { userId: string }) {
    return this.subscriptionsService.getUserSubscriptions(user.userId);
  }
}
