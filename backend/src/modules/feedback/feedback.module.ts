import { Module } from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { FeedbackController } from "./feedback.controller";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [ChatModule],
  providers: [FeedbackService],
  controllers: [FeedbackController]
})
export class FeedbackModule {}
