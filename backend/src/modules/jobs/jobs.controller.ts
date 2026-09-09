import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { JobsService } from "./jobs.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { ApplyJobDto } from "./dto/apply-job.dto";
import {
  CompleteApplicationDto,
  UpdateApplicationStatusDto
} from "./dto/update-application-status.dto";
import { ReferJobDto } from "./dto/refer-job.dto";

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

  @Patch("applications/:applicationId/status")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateApplicationStatus(
    @CurrentUser() user: { userId: string },
    @Param("applicationId") applicationId: string,
    @Body() dto: UpdateApplicationStatusDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.jobsService.updateApplicationStatus(
      user.userId,
      applicationId,
      dto.status,
      audit
    );
  }

  @Post("applications/:applicationId/complete")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  completeApplication(
    @CurrentUser() user: { userId: string },
    @Param("applicationId") applicationId: string,
    @Body() dto: CompleteApplicationDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.jobsService.completeApplication(
      user.userId,
      applicationId,
      dto.ratingValue,
      dto.comments,
      audit
    );
  }

  @Post("applications/:applicationId/rate-employer")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  rateEmployer(
    @CurrentUser() user: { userId: string },
    @Param("applicationId") applicationId: string,
    @Body() dto: CompleteApplicationDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.jobsService.rateEmployer(
      user.userId,
      applicationId,
      dto.ratingValue,
      dto.comments,
      audit
    );
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

  @Post(":jobId/repost")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  repostJob(
    @CurrentUser() user: { userId: string },
    @Param("jobId") jobId: string,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.jobsService.repostJob(user.userId, jobId, audit);
  }

  @Post(":jobId/refer")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  referJob(
    @CurrentUser() user: { userId: string },
    @Param("jobId") jobId: string,
    @Body() dto: ReferJobDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.jobsService.referJobInApp(user.userId, jobId, dto.recipientUserId, audit);
  }
}
