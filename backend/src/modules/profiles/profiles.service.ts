import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { TagLinkType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { StorageService } from "../storage/storage.service";
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
    return updateResult;
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

    const rater = await this.prisma.userRoleLink.findFirst({
      where: {
        userId: ratedByUserId,
        groupId: 2,
        isActive: true
      }
    });
    if (!rater) {
      throw new ForbiddenException("Only employer or agency can rate talent");
    }

    const talent = await this.prisma.userRoleLink.findFirst({
      where: {
        userId: ratedForUserId,
        groupId: 1,
        isActive: true
      }
    });
    if (!talent) {
      throw new BadRequestException("Rated user must be a talent member");
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

    const aggregate = await this.prisma.userRating.aggregate({
      where: { ratedForUserId, isActive: true },
      _avg: { ratingValue: true },
      _count: { ratingValue: true }
    });

    const updated = await this.prisma.userAccount.update({
      where: { id: ratedForUserId },
      data: {
        ratingAverage: aggregate._avg.ratingValue ?? 0,
        ratingCount: aggregate._count.ratingValue,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
    return updated;
  }

  async getUserProfile(userId: string) {
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
        }
      }
    });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    const photo = profile.mediaAssets[0];
    return {
      ...profile,
      profilePhotoUrl: photo ? await this.storage.getReadUrl(photo.objectKey) : null,
      profilePhotoObjectKey: photo?.objectKey ?? null
    };
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
