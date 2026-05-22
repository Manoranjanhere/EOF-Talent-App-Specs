import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GroupId } from "@eof/shared";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getMe(@CurrentUser() user: { userId: string }) {
    return this.usersService.getMe(user.userId);
  }

  @Patch(":id/activate")
  @Roles(GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  activate(
    @Param("id") id: string,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.usersService.setUserActive(id, true, audit);
  }

  @Patch(":id/deactivate")
  @Roles(GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  deactivate(
    @Param("id") id: string,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.usersService.setUserActive(id, false, audit);
  }

  @Patch(":id/login-enabled")
  @Roles(GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  setLoginEnabled(
    @Param("id") id: string,
    @Body() body: { loginEnabled: boolean },
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.usersService.setLoginEnabled(id, body.loginEnabled, audit);
  }
}
