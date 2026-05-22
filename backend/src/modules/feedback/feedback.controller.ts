import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { FeedbackService } from "./feedback.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";

@ApiTags("feedback")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateFeedbackDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.feedbackService.create(user.userId, dto, audit);
  }

  @Get("me")
  listMine(@CurrentUser() user: { userId: string }) {
    return this.feedbackService.listForUser(user.userId);
  }
}
