import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GroupId } from "@eof/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SearchService } from "./search.service";
import { MemberSearchQuery } from "./dto/member-search.query";
import { JobSearchQuery } from "./dto/job-search.query";

@ApiTags("search")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /** Employers/agencies discover talent — not for talent members. */
  @Get("members")
  @Roles(GroupId.TalentEmployerOrAgency, GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  searchMembers(@Query() query: MemberSearchQuery) {
    return this.searchService.searchMembers(query);
  }

  /** Talent browses open jobs — employers post jobs instead of searching listings. */
  @Get("jobs")
  @Roles(GroupId.Talent, GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
  searchJobs(
    @CurrentUser() user: { userId: string },
    @Query() query: JobSearchQuery
  ) {
    return this.searchService.searchJobs(user.userId, query);
  }
}
