import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { AlbumVisibility, MediaAssetType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CreateAlbumDto } from "./dto/create-album.dto";
import { AddMediaAssetDto } from "./dto/add-media-asset.dto";
import { GrantAlbumAccessDto } from "./dto/grant-album-access.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class AlbumsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAlbum(ownerUserId: string, dto: CreateAlbumDto, audit: AuditData) {
    const existingCount = await this.prisma.mediaAlbum.count({
      where: { ownerUserId, isActive: true }
    });
    if (existingCount >= 5) {
      throw new BadRequestException("Maximum 5 albums allowed");
    }

    return this.prisma.mediaAlbum.create({
      data: {
        ownerUserId,
        title: dto.title,
        visibility: dto.visibility,
        sortOrder: existingCount + 1,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }

  async addAsset(
    ownerUserId: string,
    albumId: string,
    dto: AddMediaAssetDto,
    audit: AuditData
  ) {
    const album = await this.prisma.mediaAlbum.findUnique({
      where: { id: albumId }
    });
    if (!album || !album.isActive) {
      throw new NotFoundException("Album not found");
    }
    if (album.ownerUserId !== ownerUserId) {
      throw new ForbiddenException("Album access denied");
    }

    const assets = await this.prisma.mediaAsset.findMany({
      where: { albumId, isActive: true }
    });
    const videoCount = assets.filter((a) => a.assetType === MediaAssetType.VIDEO).length;
    const imageCount = assets.filter((a) => a.assetType === MediaAssetType.IMAGE).length;
    if (assets.length >= 10) {
      throw new BadRequestException("Only 10 assets allowed per album");
    }
    if (dto.assetType === MediaAssetType.VIDEO && videoCount >= 1) {
      throw new BadRequestException("Only one video allowed per album");
    }
    if (dto.assetType === MediaAssetType.IMAGE && imageCount >= 9) {
      throw new BadRequestException("Only 9 photos allowed when album has a video slot");
    }

    if (dto.isProfilePhoto) {
      await this.prisma.mediaAsset.updateMany({
        where: { ownerUserId, isProfilePhoto: true },
        data: {
          isProfilePhoto: false,
          lastUpdateIp: audit.ip,
          lastUpdateBy: audit.updatedBy
        }
      });
    }

    const asset = await this.prisma.mediaAsset.create({
      data: {
        ownerUserId,
        albumId,
        assetType: dto.assetType,
        objectKey: dto.objectKey,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        durationSeconds: dto.durationSeconds,
        isProfilePhoto: dto.isProfilePhoto ?? false,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    if (dto.isProfilePhoto) {
      await this.prisma.userAccount.update({
        where: { id: ownerUserId },
        data: {
          profilePhotoAssetId: asset.id,
          lastUpdateIp: audit.ip,
          lastUpdateBy: audit.updatedBy
        }
      });
    }

    return asset;
  }

  async grantPrivateAccess(
    ownerUserId: string,
    albumId: string,
    dto: GrantAlbumAccessDto,
    audit: AuditData
  ) {
    const album = await this.prisma.mediaAlbum.findUnique({
      where: { id: albumId }
    });
    if (!album || !album.isActive) {
      throw new NotFoundException("Album not found");
    }
    if (album.ownerUserId !== ownerUserId) {
      throw new ForbiddenException("Only album owner can grant access");
    }
    if (album.visibility !== AlbumVisibility.PRIVATE) {
      throw new BadRequestException("Access grants are supported only for private albums");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + dto.grantedDays * 24 * 60 * 60 * 1000);
    return this.prisma.albumAccessGrant.upsert({
      where: {
        albumId_grantedToUserId: {
          albumId,
          grantedToUserId: dto.grantedToUserId
        }
      },
      create: {
        albumId,
        grantedToUserId: dto.grantedToUserId,
        grantedByUserId: ownerUserId,
        grantedDays: dto.grantedDays,
        startsAt: now,
        expiresAt,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      },
      update: {
        grantedDays: dto.grantedDays,
        startsAt: now,
        expiresAt,
        isActive: true,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }

  listAccessGrants(ownerUserId: string, albumId: string) {
    return this.prisma.albumAccessGrant.findMany({
      where: {
        albumId,
        album: { ownerUserId }
      },
      include: {
        grantedToUser: true
      },
      orderBy: { expiresAt: "desc" }
    });
  }

  async revokeAccess(ownerUserId: string, grantId: string, audit: AuditData) {
    const grant = await this.prisma.albumAccessGrant.findUnique({
      where: { id: grantId },
      include: { album: true }
    });
    if (!grant) {
      throw new NotFoundException("Access grant not found");
    }
    if (grant.album.ownerUserId !== ownerUserId) {
      throw new ForbiddenException("Not allowed");
    }

    return this.prisma.albumAccessGrant.update({
      where: { id: grantId },
      data: {
        isActive: false,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });
  }
}
