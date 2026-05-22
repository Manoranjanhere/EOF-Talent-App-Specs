import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { TagLinkType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
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
  constructor(private readonly prisma: PrismaService) {}

  async updateTalentProfile(userId: string, dto: UpdateTalentProfileDto, audit: AuditData) {
    const updateResult = await this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        age: dto.age,
        gender: dto.gender,
        city: dto.city,
        country: dto.country,
        instagramUrl: dto.instagramUrl,
        snapchatUrl: dto.snapchatUrl,
        youtubeUrl: dto.youtubeUrl,
        tiktokUrl: dto.tiktokUrl,
        miniBio: dto.miniBio,
        lookingForWork: dto.lookingForWork,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy,
        profileTalent: {
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
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    return this.prisma.profileOrg.upsert({
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
      }
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

    await this.prisma.profileTagLink.updateMany({
      where: { userId, isActive: true },
      data: {
        isActive: false,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    const createRows = [
      ...dto.primaryTagIds.map((tagId) => ({
        userId,
        tagId,
        linkType: TagLinkType.PRIMARY,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      })),
      ...dto.secondaryTagIds.map((tagId) => ({
        userId,
        tagId,
        linkType: TagLinkType.SECONDARY,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }))
    ];
    if (createRows.length > 0) {
      await this.prisma.profileTagLink.createMany({ data: createRows });
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

    await this.prisma.talentRating.upsert({
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

    const aggregate = await this.prisma.talentRating.aggregate({
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
        profileTalent: true,
        profileOrg: { include: { orgType: true } },
        profileTags: {
          where: { isActive: true },
          include: { tag: true }
        }
      }
    });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
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
