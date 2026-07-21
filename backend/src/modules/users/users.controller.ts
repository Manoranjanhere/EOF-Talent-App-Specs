import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GroupId } from "@eof/shared";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UsersService } from "./users.service";
import { SetUserRoleDto } from "./dto/set-user-role.dto";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getMe(@CurrentUser() user: { userId: string }) {
    return this.usersService.getMe(user.userId);
  }

  @Get()
  @Roles(GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  listUsers(
    @Query("q") q?: string,
    @Query("status") status?: "all" | "active" | "banned",
    @Query("loginEnabled") loginEnabled?: "all" | "yes" | "no",
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.usersService.listUsers({
      q,
      status: status ?? "all",
      loginEnabled: loginEnabled ?? "all",
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50
    });
  }

  @Patch(":id/activate")
  @Roles(GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  activate(
    @Param("id") id: string,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.usersService.unbanUser(id, audit, "admin_activate");
  }

  @Patch(":id/deactivate")
  @Roles(GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  deactivate(
    @Param("id") id: string,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.usersService.banUser(id, audit, "admin_deactivate");
  }

  @Patch(":id/ban")
  @Roles(GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  ban(
    @Param("id") id: string,
    @Body() body: { notes?: string },
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.usersService.banUser(id, audit, body?.notes);
  }

  @Patch(":id/unban")
  @Roles(GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  unban(
    @Param("id") id: string,
    @Body() body: { notes?: string },
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.usersService.unbanUser(id, audit, body?.notes);
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

  /** Super Admin only — grant or revoke Admin / Team Admin / Super Admin role. */
  @Post(":id/roles")
  @Roles(GroupId.SuperAdmin)
  setAdminRole(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() dto: SetUserRoleDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.usersService.setUserAdminRole(
      user.userId,
      id,
      dto.groupId,
      dto.grant,
      audit
    );
  }
}
