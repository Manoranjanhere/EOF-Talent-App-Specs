import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { JobsService } from "./jobs.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { ApplyJobDto } from "./dto/apply-job.dto";

@ApiTags("jobs")
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get("mine")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listMyJobs(@CurrentUser() user: { userId: string }) {
    return this.jobsService.listMyJobs(user.userId);
  }

  @Get("mine/:jobId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMyJob(
    @CurrentUser() user: { userId: string },
    @Param("jobId") jobId: string
  ) {
    return this.jobsService.getMyJob(user.userId, jobId);
  }

  @Get()
  listJobs() {
    return this.jobsService.listJobs();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createJob(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateJobDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.jobsService.createJob(user.userId, dto, audit);
  }

  @Post(":jobId/apply")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  applyToJob(
    @CurrentUser() user: { userId: string },
    @Param("jobId") jobId: string,
    @Body() dto: ApplyJobDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.jobsService.applyToJob(user.userId, jobId, dto, audit);
  }
}
