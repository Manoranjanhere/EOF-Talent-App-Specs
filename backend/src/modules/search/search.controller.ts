import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { MemberSearchQuery } from "./dto/member-search.query";
import { JobSearchQuery } from "./dto/job-search.query";

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get("members")
  searchMembers(@Query() query: MemberSearchQuery) {
    return this.searchService.searchMembers(query);
  }

  @Get("jobs")
  searchJobs(@Query() query: JobSearchQuery) {
    return this.searchService.searchJobs(query);
  }
}
