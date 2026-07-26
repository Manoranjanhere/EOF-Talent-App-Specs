import { Module } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionsController } from "./subscriptions.controller";
import { PlayBillingService } from "./play-billing.service";

@Module({
  providers: [SubscriptionsService, PlayBillingService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService, PlayBillingService]
})
export class SubscriptionsModule {}
