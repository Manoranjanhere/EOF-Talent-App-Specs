import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GroupId } from "@eof/shared";
import { Audit } from "../../common/decorators/audit.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { TagsService } from "./tags.service";
import { CreateTagDto } from "./dto/create-tag.dto";

@ApiTags("tags")
@Controller("tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  listPublished() {
    return this.tagsService.listPublished();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  create(
    @Body() dto: CreateTagDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.tagsService.create(dto, audit);
  }
}
