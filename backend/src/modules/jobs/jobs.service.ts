import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { TagLinkType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { ApplyJobDto } from "./dto/apply-job.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(postedByUserId: string, dto: CreateJobDto, audit: AuditData) {
    const employerRole = await this.prisma.userRoleLink.findFirst({
      where: {
        userId: postedByUserId,
        groupId: 2,
        isActive: true
      }
    });
    if (!employerRole) {
      throw new ForbiddenException("Only employer or agency can post jobs");
    }

    const hasJobPostingSubscription = await this.prisma.userSubscription.findFirst({
      where: {
        userId: postedByUserId,
        isActive: true,
        lastExpiry: { gte: new Date() },
        plan: {
          isJobPostingPlan: true,
          published: true,
          isActive: true
        }
      }
    });
    if (!hasJobPostingSubscription) {
      throw new ForbiddenException("Active job posting subscription required");
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
    return this.prisma.jobPosting.create({
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
  }

  listJobs() {
    return this.prisma.jobPosting.findMany({
      where: { isActive: true, validTill: { gte: new Date() } },
      include: {
        postedBy: true,
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

    return this.prisma.jobApplication.upsert({
      where: {
        jobId_applicantUserId: { jobId, applicantUserId }
      },
      create: {
        jobId,
        applicantUserId,
        message: dto.message,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      },
      update: {
        message: dto.message,
        isActive: true,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }
}
