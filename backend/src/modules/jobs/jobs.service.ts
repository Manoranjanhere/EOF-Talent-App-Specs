import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { GigReviewerRole, JobApplicationStatus, TagLinkType } from "../../database/prisma-client";
import { GroupId } from "@eof/shared";
import { resolveProfilePhotos } from "../../common/profile-photos";
import { PrismaService } from "../../database/prisma.service";
import { ChatService } from "../chat/chat.service";
import { StorageService } from "../storage/storage.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { ApplyJobDto } from "./dto/apply-job.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly storage: StorageService
  ) {}

  async createJob(postedByUserId: string, dto: CreateJobDto, audit: AuditData) {
    const employerRole = await this.prisma.userRoleLink.findFirst({
      where: {
        userId: postedByUserId,
        groupId: GroupId.TalentEmployerOrAgency,
        isActive: true
      }
    });
    if (!employerRole) {
      throw new ForbiddenException("Only employer or agency can post jobs");
    }

    const subscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId: postedByUserId,
        isActive: true,
        lastExpiry: { gte: new Date() },
        plan: {
          isJobPostingPlan: true,
          published: true,
          isActive: true
        }
      },
      orderBy: { purchaseDate: "asc" },
      include: { plan: true }
    });
    if (!subscription) {
      throw new ForbiddenException(
        "Purchase a job posting slot (₹100 per job, 90-day listing) before publishing"
      );
    }

    if (
      dto.ageRangeMin != null &&
      dto.ageRangeMax != null &&
      dto.ageRangeMin > dto.ageRangeMax
    ) {
      throw new BadRequestException("Age range minimum cannot exceed maximum");
    }

    if (
      dto.payRangeMin != null &&
      dto.payRangeMax != null &&
      dto.payRangeMin > dto.payRangeMax
    ) {
      throw new BadRequestException("Pay range minimum cannot exceed maximum");
    }

    const combinedTags = [...dto.primaryTagIds, ...dto.secondaryTagIds];
    const distinct = new Set(combinedTags);
    if (distinct.size !== combinedTags.length) {
      throw new BadRequestException("Primary and secondary tags must be unique");
    }

    const validTagCount = await this.prisma.tagMaster.count({
      where: { id: { in: combinedTags }, isActive: true, published: true }
    });
    if (validTagCount !== combinedTags.length) {
      throw new BadRequestException("Invalid tag(s) provided");
    }

    const validTill = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.jobPosting.create({
        data: {
          postedByUserId,
          title: dto.title,
          miniDescription: dto.miniDescription,
          gender: dto.gender,
          ageRangeMin: dto.ageRangeMin,
          ageRangeMax: dto.ageRangeMax,
          city: dto.city,
          country: dto.country,
          payRangeMin: dto.payRangeMin,
          payRangeMax: dto.payRangeMax,
          validTill,
          lastUpdateIp: audit.ip,
          lastUpdateBy: audit.updatedBy,
          tags: {
            create: [
              ...dto.primaryTagIds.map((tagId) => ({
                tagId,
                linkType: TagLinkType.PRIMARY,
                lastUpdateIp: audit.ip,
                lastUpdateBy: audit.updatedBy
              })),
              ...dto.secondaryTagIds.map((tagId) => ({
                tagId,
                linkType: TagLinkType.SECONDARY,
                lastUpdateIp: audit.ip,
                lastUpdateBy: audit.updatedBy
              }))
            ]
          }
        },
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      await tx.userSubscription.update({
        where: { id: subscription.id },
        data: {
          isActive: false,
          lastUpdateIp: audit.ip,
          lastUpdateBy: audit.updatedBy
        }
      });

      return job;
    });
  }

  listMyJobs(postedByUserId: string) {
    return this.prisma.jobPosting.findMany({
      where: { postedByUserId, isActive: true },
      include: this.jobInclude(),
      orderBy: { createdAt: "desc" }
    });
  }

  async getMyJob(postedByUserId: string, jobId: string) {
    const job = await this.prisma.jobPosting.findFirst({
      where: { id: jobId, postedByUserId, isActive: true },
      include: this.jobInclude()
    });
    if (!job) {
      throw new NotFoundException("Job not found");
    }
    const photos = await resolveProfilePhotos(
      this.prisma,
      this.storage,
      job.applications.map((app) => app.applicant.id)
    );
    return {
      ...job,
      applications: job.applications.map((app) => {
        const photo = photos.get(app.applicant.id);
        return {
          ...app,
          applicant: {
            ...app.applicant,
            profilePhotoUrl: photo?.url ?? null,
            profilePhotoObjectKey: photo?.objectKey ?? null
          }
        };
      })
    };
  }

  private jobInclude() {
    return {
      tags: { where: { isActive: true }, include: { tag: true } },
      applications: {
        where: { isActive: true },
        include: {
          applicant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              mobileNumber: true,
              city: true,
              country: true,
              ratingAverage: true,
              profileTags: {
                where: { isActive: true },
                include: { tag: true }
              }
            }
          },
          gigReviews: { where: { isActive: true } }
        },
        orderBy: { createdAt: "desc" as const }
      }
    };
  }

  listJobs() {
    return this.prisma.jobPosting.findMany({
      where: { isActive: true, validTill: { gte: new Date() } },
      include: {
        postedBy: { select: { id: true, fullName: true } },
        tags: { where: { isActive: true }, include: { tag: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async applyToJob(applicantUserId: string, jobId: string, dto: ApplyJobDto, audit: AuditData) {
    const job = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job || !job.isActive) {
      throw new NotFoundException("Job not found");
    }
    if (job.validTill < new Date()) {
      throw new BadRequestException("Job posting expired");
    }
    if (job.postedByUserId === applicantUserId) {
      throw new BadRequestException("You cannot apply to your own job");
    }

    const existing = await this.prisma.jobApplication.findUnique({
      where: { jobId_applicantUserId: { jobId, applicantUserId } }
    });
    if (existing?.jobCompleted) {
      throw new BadRequestException("This gig is already completed");
    }

    return this.prisma.jobApplication.upsert({
      where: {
        jobId_applicantUserId: { jobId, applicantUserId }
      },
      create: {
        jobId,
        applicantUserId,
        message: dto.message,
        status: JobApplicationStatus.APPLIED,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      },
      update: {
        message: dto.message,
        isActive: true,
        status: JobApplicationStatus.APPLIED,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }

  async updateApplicationStatus(
    employerUserId: string,
    applicationId: string,
    status: JobApplicationStatus,
    audit: AuditData
  ) {
    const application = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, isActive: true },
      include: { job: true }
    });
    if (!application) throw new NotFoundException("Application not found");
    if (application.job.postedByUserId !== employerUserId) {
      throw new ForbiddenException("You can only update applications on your jobs");
    }
    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status, lastUpdateIp: audit.ip, lastUpdateBy: audit.updatedBy }
    });
  }

  async completeApplication(
    employerUserId: string,
    applicationId: string,
    ratingValue: number,
    comments: string | undefined,
    audit: AuditData
  ) {
    const application = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, isActive: true },
      include: { job: true }
    });
    if (!application) throw new NotFoundException("Application not found");
    if (application.job.postedByUserId !== employerUserId) {
      throw new ForbiddenException("You can only complete hires on your jobs");
    }
    if (application.status !== JobApplicationStatus.HIRED) {
      throw new BadRequestException("Mark the candidate as Hired before Job completed");
    }

    const updated = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        jobCompleted: true,
        completedAt: new Date(),
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    await this.upsertGigReview({
      jobId: application.jobId,
      applicationId,
      ratedForUserId: application.applicantUserId,
      ratedByUserId: employerUserId,
      reviewerRole: GigReviewerRole.EMPLOYER_RATES_TALENT,
      ratingValue,
      comments,
      audit
    });

    return updated;
  }

  async rateEmployer(
    talentUserId: string,
    applicationId: string,
    ratingValue: number,
    comments: string | undefined,
    audit: AuditData
  ) {
    const application = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, applicantUserId: talentUserId, isActive: true },
      include: { job: true }
    });
    if (!application) throw new NotFoundException("Application not found");
    if (!application.jobCompleted) {
      throw new BadRequestException("You can rate the employer after the gig is marked completed");
    }

    await this.upsertGigReview({
      jobId: application.jobId,
      applicationId,
      ratedForUserId: application.job.postedByUserId,
      ratedByUserId: talentUserId,
      reviewerRole: GigReviewerRole.TALENT_RATES_EMPLOYER,
      ratingValue,
      comments,
      audit
    });

    return { ok: true };
  }

  async repostJob(postedByUserId: string, jobId: string, audit: AuditData) {
    const source = await this.prisma.jobPosting.findFirst({
      where: { id: jobId, postedByUserId, isActive: true },
      include: { tags: { where: { isActive: true } } }
    });
    if (!source) throw new NotFoundException("Job not found");

    const dto: CreateJobDto = {
      title: source.title,
      miniDescription: source.miniDescription,
      gender: source.gender ?? undefined,
      ageRangeMin: source.ageRangeMin ?? undefined,
      ageRangeMax: source.ageRangeMax ?? undefined,
      city: source.city ?? undefined,
      country: source.country ?? undefined,
      payRangeMin: source.payRangeMin ?? undefined,
      payRangeMax: source.payRangeMax ?? undefined,
      primaryTagIds: source.tags.filter((t) => t.linkType === TagLinkType.PRIMARY).map((t) => t.tagId),
      secondaryTagIds: source.tags
        .filter((t) => t.linkType === TagLinkType.SECONDARY)
        .map((t) => t.tagId)
    };
    return this.createJob(postedByUserId, dto, audit);
  }

  async referJobInApp(
    referrerUserId: string,
    jobId: string,
    recipientUserId: string,
    audit: AuditData
  ) {
    const job = await this.prisma.jobPosting.findFirst({
      where: { id: jobId, isActive: true, validTill: { gte: new Date() } }
    });
    if (!job) throw new NotFoundException("Job not found");
    if (referrerUserId === recipientUserId) {
      throw new BadRequestException("You cannot refer a job to yourself");
    }

    const thread = await this.chatService.findOrCreateDirectThread(
      referrerUserId,
      recipientUserId,
      audit
    );
    if (!thread) {
      throw new BadRequestException("Could not open a chat thread for this referral");
    }
    await this.chatService.sendMessage(
      referrerUserId,
      thread.id,
      {
        messageText: `Job referral: "${job.title}" — have a look on the Jobs board.`
      },
      audit
    );
    return { ok: true, threadId: thread.id };
  }

  private async upsertGigReview(input: {
    jobId: string;
    applicationId: string;
    ratedForUserId: string;
    ratedByUserId: string;
    reviewerRole: GigReviewerRole;
    ratingValue: number;
    comments?: string;
    audit: AuditData;
  }) {
    await this.prisma.jobGigReview.upsert({
      where: {
        applicationId_reviewerRole: {
          applicationId: input.applicationId,
          reviewerRole: input.reviewerRole
        }
      },
      create: {
        jobId: input.jobId,
        applicationId: input.applicationId,
        ratedForUserId: input.ratedForUserId,
        ratedByUserId: input.ratedByUserId,
        reviewerRole: input.reviewerRole,
        ratingValue: input.ratingValue,
        comments: input.comments,
        lastUpdateIp: input.audit.ip,
        lastUpdateBy: input.audit.updatedBy
      },
      update: {
        ratingValue: input.ratingValue,
        comments: input.comments,
        isActive: true,
        lastUpdateIp: input.audit.ip,
        lastUpdateBy: input.audit.updatedBy
      }
    });

    await this.syncRatingAverage(input.ratedForUserId, input.audit);
  }

  private async syncRatingAverage(userId: string, audit: AuditData) {
    const [gigs, profiles] = await Promise.all([
      this.prisma.jobGigReview.findMany({
        where: { ratedForUserId: userId, isActive: true },
        select: { ratedByUserId: true, ratingValue: true }
      }),
      this.prisma.userRating.findMany({
        where: { ratedForUserId: userId, isActive: true },
        select: { ratedByUserId: true, ratingValue: true }
      })
    ]);
    const gigRaters = new Set(gigs.map((row) => row.ratedByUserId));
    const values = [
      ...gigs.map((row) => row.ratingValue),
      ...profiles.filter((row) => !gigRaters.has(row.ratedByUserId)).map((row) => row.ratingValue)
    ];
    const total = values.length;
    const avg = total === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / total;
    await this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        ratingAverage: avg,
        ratingCount: total,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }
}
