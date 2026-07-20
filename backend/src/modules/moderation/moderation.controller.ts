import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GroupId } from "@eof/shared";
import { FlagStatus } from "@prisma/client";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ModerationService } from "./moderation.service";
import { FlagUserDto } from "./dto/flag-user.dto";
import { AdminActionDto } from "./dto/admin-action.dto";

@ApiTags("moderation")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("moderation")
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post("flags")
  flagUser(
    @CurrentUser() user: { userId: string },
    @Body() dto: FlagUserDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.moderationService.flagUser(user.userId, dto, audit);
  }

  @Get("flags")
  @Roles(GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  listFlags(@Query("status") status?: FlagStatus) {
    return this.moderationService.listReports(status);
  }

  @Post("actions")
  @Roles(GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  takeAction(
    @CurrentUser() user: { userId: string },
    @Body() dto: AdminActionDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.moderationService.takeAction(user.userId, dto, audit);
  }
}
