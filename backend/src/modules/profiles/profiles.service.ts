import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { GigReviewerRole, TagLinkType } from "../../database/prisma-client";
import { GroupId } from "@eof/shared";
import { PrismaService } from "../../database/prisma.service";
import { StorageService } from "../storage/storage.service";
import { withoutPassword } from "../../common/without-password";
import { UpdateTalentProfileDto } from "./dto/update-talent-profile.dto";
import { UpdateOrgProfileDto } from "./dto/update-org-profile.dto";
import { SetProfileTagsDto } from "./dto/set-profile-tags.dto";
import { RateTalentDto } from "./dto/rate-talent.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  async updateTalentProfile(userId: string, dto: UpdateTalentProfileDto, audit: AuditData) {
    const updateResult = await this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        age: dto.age,
        gender: dto.gender,
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        city: dto.city,
        country: dto.country,
        instagramUrl: dto.instagramUrl,
        snapchatUrl: dto.snapchatUrl,
        youtubeUrl: dto.youtubeUrl,
        tiktokUrl: dto.tiktokUrl,
        miniBio: dto.miniBio,
        isAvailable: dto.isAvailable,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy,
        profileMember: {
          upsert: {
            create: {
              lastUpdateIp: audit.ip,
              lastUpdateBy: audit.updatedBy
            },
            update: {
              lastUpdateIp: audit.ip,
              lastUpdateBy: audit.updatedBy
            }
          }
        }
      }
    });

    await this.assertProfilePhotoExists(userId);
    return withoutPassword(updateResult);
  }

  async updateOrgProfile(userId: string, dto: UpdateOrgProfileDto, audit: AuditData) {
    const orgType = await this.prisma.orgTypeMaster.findUnique({
      where: { id: dto.orgTypeId }
    });
    if (!orgType) {
      throw new BadRequestException("Invalid org type");
    }

    await this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        defaultOrgTypeId: dto.orgTypeId,
        websiteUrl: dto.websiteUrl,
        instagramUrl: dto.instagramUrl,
        facebookUrl: dto.facebookUrl,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    const org = await this.prisma.profileOrg.upsert({
      where: { userId },
      create: {
        userId,
        orgTypeId: dto.orgTypeId,
        legalName: dto.legalName,
        addressLine: dto.addressLine,
        taxId: dto.taxId,
        contactName: dto.contactName,
        contactPosition: dto.contactPosition,
        contactNumber: dto.contactNumber,
        contactEmail: dto.contactEmail,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      },
      update: {
        orgTypeId: dto.orgTypeId,
        legalName: dto.legalName,
        addressLine: dto.addressLine,
        taxId: dto.taxId,
        contactName: dto.contactName,
        contactPosition: dto.contactPosition,
        contactNumber: dto.contactNumber,
        contactEmail: dto.contactEmail,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      },
      include: { orgType: true }
    });
    await this.assertProfilePhotoExists(userId);
    return org;
  }

  listOrgTypes() {
    return this.prisma.orgTypeMaster.findMany({
      where: { published: true, isActive: true },
      orderBy: { id: "asc" }
    });
  }

  async setProfileTags(userId: string, dto: SetProfileTagsDto, audit: AuditData) {
    const combined = [...dto.primaryTagIds, ...dto.secondaryTagIds];
    const distinct = new Set(combined);
    if (distinct.size !== combined.length) {
      throw new BadRequestException("Primary and secondary tags must be unique");
    }

    const tagsCount = await this.prisma.tagMaster.count({
      where: { id: { in: combined }, isActive: true, published: true }
    });
    if (tagsCount !== combined.length) {
      throw new BadRequestException("One or more tags are invalid");
    }

    // Soft-deactivate current links (never hard-delete).
    await this.prisma.profileTagLink.updateMany({
      where: { userId, isActive: true },
      data: {
        isActive: false,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    // Upsert so previously soft-deleted (user, tag, linkType) rows can be reactivated.
    const createRows = [
      ...dto.primaryTagIds.map((tagId) => ({
        userId,
        tagId,
        linkType: TagLinkType.PRIMARY
      })),
      ...dto.secondaryTagIds.map((tagId) => ({
        userId,
        tagId,
        linkType: TagLinkType.SECONDARY
      }))
    ];

    for (const row of createRows) {
      await this.prisma.profileTagLink.upsert({
        where: {
          userId_tagId_linkType: {
            userId: row.userId,
            tagId: row.tagId,
            linkType: row.linkType
          }
        },
        create: {
          userId: row.userId,
          tagId: row.tagId,
          linkType: row.linkType,
          isActive: true,
          lastUpdateIp: audit.ip,
          lastUpdateBy: audit.updatedBy
        },
        update: {
          isActive: true,
          lastUpdateIp: audit.ip,
          lastUpdateBy: audit.updatedBy
        }
      });
    }

    return this.prisma.profileTagLink.findMany({
      where: { userId, isActive: true },
      include: { tag: true }
    });
  }

  async rateTalent(
    ratedByUserId: string,
    ratedForUserId: string,
    dto: RateTalentDto,
    audit: AuditData
  ) {
    if (ratedByUserId === ratedForUserId) {
      throw new BadRequestException("Self rating is not allowed");
    }

    const [raterRoles, targetRoles] = await Promise.all([
      this.prisma.userRoleLink.findMany({
        where: { userId: ratedByUserId, isActive: true }
      }),
      this.prisma.userRoleLink.findMany({
        where: { userId: ratedForUserId, isActive: true }
      })
    ]);
    const raterIsEmployer = raterRoles.some((r) => r.groupId === GroupId.TalentEmployerOrAgency);
    const raterIsTalent = raterRoles.some((r) => r.groupId === GroupId.Talent);
    const targetIsEmployer = targetRoles.some((r) => r.groupId === GroupId.TalentEmployerOrAgency);
    const targetIsTalent = targetRoles.some((r) => r.groupId === GroupId.Talent);

    const employerRatesTalent = raterIsEmployer && targetIsTalent;
    const talentRatesEmployer = raterIsTalent && targetIsEmployer;
    if (!employerRatesTalent && !talentRatesEmployer) {
      throw new ForbiddenException("Employers rate talent and talent rate employers");
    }

    if (dto.jobId) {
      const application = await this.prisma.jobApplication.findFirst({
        where: {
          jobId: dto.jobId,
          isActive: true,
          jobCompleted: true,
          ...(employerRatesTalent
            ? { applicantUserId: ratedForUserId, job: { postedByUserId: ratedByUserId } }
            : { applicantUserId: ratedByUserId, job: { postedByUserId: ratedForUserId } })
        }
      });
      if (application) {
        await this.prisma.jobGigReview.upsert({
          where: {
            applicationId_reviewerRole: {
              applicationId: application.id,
              reviewerRole: employerRatesTalent
                ? GigReviewerRole.EMPLOYER_RATES_TALENT
                : GigReviewerRole.TALENT_RATES_EMPLOYER
            }
          },
          create: {
            jobId: dto.jobId,
            applicationId: application.id,
            ratedForUserId,
            ratedByUserId,
            reviewerRole: employerRatesTalent
              ? GigReviewerRole.EMPLOYER_RATES_TALENT
              : GigReviewerRole.TALENT_RATES_EMPLOYER,
            ratingValue: dto.ratingValue,
            comments: dto.comments,
            lastUpdateIp: audit.ip,
            lastUpdateBy: audit.updatedBy
          },
          update: {
            ratingValue: dto.ratingValue,
            comments: dto.comments,
            isActive: true,
            lastUpdateIp: audit.ip,
            lastUpdateBy: audit.updatedBy
          }
        });
      }
    }

    await this.prisma.userRating.upsert({
      where: {
        ratedForUserId_ratedByUserId: {
          ratedForUserId,
          ratedByUserId
        }
      },
      create: {
        ratedForUserId,
        ratedByUserId,
        ratingValue: dto.ratingValue,
        comments: dto.comments,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      },
      update: {
        ratingValue: dto.ratingValue,
        comments: dto.comments,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    await this.syncRatingAverage(ratedForUserId, audit);
    const updated = await this.prisma.userAccount.findUnique({ where: { id: ratedForUserId } });
    if (!updated) throw new NotFoundException("Profile not found");
    const { passwordHash, ...safe } = updated;
    void passwordHash;
    return { ...safe, myRating: dto.ratingValue };
  }

  async getUserProfile(userId: string, viewerUserId?: string) {
    const profile = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      include: {
        profileMember: true,
        profileOrg: { include: { orgType: true } },
        profileTags: {
          where: { isActive: true },
          include: { tag: true }
        },
        mediaAssets: {
          where: { isProfilePhoto: true, isActive: true },
          take: 1
        },
        roles: { where: { isActive: true } }
      }
    });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    const photo = profile.mediaAssets[0];

    let myRating: number | null = null;
    if (viewerUserId && viewerUserId !== userId) {
      const existing = await this.prisma.userRating.findUnique({
        where: {
          ratedForUserId_ratedByUserId: {
            ratedForUserId: userId,
            ratedByUserId: viewerUserId
          }
        }
      });
      if (existing?.isActive) {
        myRating = existing.ratingValue;
      }
    }

    const isTalent = profile.roles.some((r) => r.groupId === GroupId.Talent);
    const isEmployer = profile.roles.some((r) => r.groupId === GroupId.TalentEmployerOrAgency);

    const seriousAboutJob = isTalent
      ? Boolean(
          await this.prisma.userSubscription.findFirst({
            where: {
              userId,
              isActive: true,
              lastExpiry: { gte: new Date() },
              plan: { code: "TALENT_SERIOUS_JOB_200", isActive: true }
            }
          })
        )
      : false;

    const completedGigs = isTalent
      ? (
          await this.prisma.jobApplication.findMany({
            where: { applicantUserId: userId, isActive: true, jobCompleted: true },
            include: {
              job: { include: { postedBy: { select: { id: true, fullName: true } } } },
              gigReviews: {
                where: {
                  isActive: true,
                  reviewerRole: GigReviewerRole.EMPLOYER_RATES_TALENT
                }
              }
            },
            orderBy: { completedAt: "desc" }
          })
        ).map((app) => ({
          applicationId: app.id,
          jobId: app.jobId,
          title: app.job.title,
          employerUserId: app.job.postedBy.id,
          employerName: app.job.postedBy.fullName,
          completedAt: app.completedAt,
          rating: app.gigReviews[0]?.ratingValue ?? null,
          comments: app.gigReviews[0]?.comments ?? null
        }))
      : [];

    let employerStats: {
      gigsPosted: number;
      gigsCompleted: number;
      avgRating: number;
    } | null = null;
    if (isEmployer) {
      const [gigsPosted, gigsCompleted] = await Promise.all([
        this.prisma.jobPosting.count({ where: { postedByUserId: userId, isActive: true } }),
        this.prisma.jobPosting.count({
          where: {
            postedByUserId: userId,
            isActive: true,
            applications: { some: { jobCompleted: true, isActive: true } }
          }
        })
      ]);
      employerStats = {
        gigsPosted,
        gigsCompleted,
        avgRating: Number(profile.ratingAverage ?? 0)
      };
    }

    const { passwordHash, ...safeProfile } = profile;
    void passwordHash;

    return {
      ...safeProfile,
      profilePhotoUrl: photo ? await this.storage.getReadUrl(photo.objectKey) : null,
      profilePhotoObjectKey: photo?.objectKey ?? null,
      myRating,
      seriousAboutJob,
      completedGigs,
      employerStats
    };
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

  private async assertProfilePhotoExists(userId: string) {
    const count = await this.prisma.mediaAsset.count({
      where: { ownerUserId: userId, isProfilePhoto: true, isActive: true }
    });
    if (count < 1) {
      throw new BadRequestException("At least one profile photo is required");
    }
  }
}
