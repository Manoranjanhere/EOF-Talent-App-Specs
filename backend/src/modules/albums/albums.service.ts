import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { AlbumVisibility, MediaAssetType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CreateAlbumDto } from "./dto/create-album.dto";
import { AddMediaAssetDto } from "./dto/add-media-asset.dto";
import { GrantAlbumAccessDto } from "./dto/grant-album-access.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class AlbumsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  async listMyAlbums(ownerUserId: string) {
    const albums = await this.prisma.mediaAlbum.findMany({
      where: { ownerUserId, isActive: true },
      include: {
        assets: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          take: 1
        },
        _count: {
          select: {
            assets: { where: { isActive: true } },
            accessGrants: { where: { isActive: true } }
          }
        }
      },
      orderBy: { sortOrder: "asc" }
    });

    return Promise.all(
      albums.map(async (album) => ({
        ...album,
        assets: await Promise.all(album.assets.map((asset) => this.hydrateAsset(asset)))
      }))
    );
  }

  async getAlbum(ownerUserId: string, albumId: string) {
    const album = await this.prisma.mediaAlbum.findFirst({
      where: { id: albumId, ownerUserId, isActive: true },
      include: {
        assets: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" }
        },
        accessGrants: {
          where: { isActive: true },
          include: {
            grantedToUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
                mobileNumber: true
              }
            }
          },
          orderBy: { expiresAt: "desc" }
        }
      }
    });
    if (!album) {
      throw new NotFoundException("Album not found");
    }
    return {
      ...album,
      assets: await Promise.all(album.assets.map((asset) => this.hydrateAsset(asset)))
    };
  }

  private async hydrateAsset(asset: {
    objectKey: string;
    thumbnailObjectKey?: string | null;
    [key: string]: unknown;
  }) {
    const url = await this.storage.getReadUrl(asset.objectKey);
    const thumbnailUrl = asset.thumbnailObjectKey
      ? await this.storage.getReadUrl(asset.thumbnailObjectKey)
      : null;
    return { ...asset, url, thumbnailUrl };
  }

  async addUploadedAsset(
    ownerUserId: string,
    albumId: string,
    file: Express.Multer.File,
    audit: AuditData,
    options?: {
      isProfilePhoto?: boolean;
      durationSeconds?: number;
      thumbnail?: Express.Multer.File;
    }
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Media file is required");
    }
    const isVideo = (file.mimetype || "").startsWith("video/");
    const assetType = isVideo ? MediaAssetType.VIDEO : MediaAssetType.IMAGE;
    const saved = await this.storage.saveBuffer({
      userId: ownerUserId,
      purpose: "album_asset",
      contentType: file.mimetype || (isVideo ? "video/mp4" : "image/jpeg"),
      buffer: file.buffer
    });

    let thumbnailObjectKey: string | undefined;
    if (options?.thumbnail?.buffer?.length) {
      const thumb = await this.storage.saveBuffer({
        userId: ownerUserId,
        purpose: "album_asset",
        contentType: options.thumbnail.mimetype || "image/jpeg",
        buffer: options.thumbnail.buffer
      });
      thumbnailObjectKey = thumb.objectKey;
    }

    return this.addAsset(
      ownerUserId,
      albumId,
      {
        assetType,
        objectKey: saved.objectKey,
        thumbnailObjectKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        durationSeconds: options?.durationSeconds,
        isProfilePhoto: options?.isProfilePhoto ?? false
      },
      audit
    );
  }

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
        thumbnailObjectKey: dto.thumbnailObjectKey,
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

    return this.hydrateAsset(asset);
  }

  async softDeleteAsset(
    ownerUserId: string,
    albumId: string,
    assetId: string,
    audit: AuditData
  ) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: assetId, albumId, ownerUserId, isActive: true }
    });
    if (!asset) {
      throw new NotFoundException("Media asset not found");
    }

    await this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: {
        isActive: false,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    return { ok: true };
  }

  async softDeleteAlbum(ownerUserId: string, albumId: string, audit: AuditData) {
    const album = await this.prisma.mediaAlbum.findFirst({
      where: { id: albumId, ownerUserId, isActive: true }
    });
    if (!album) {
      throw new NotFoundException("Album not found");
    }

    await this.prisma.$transaction([
      this.prisma.mediaAsset.updateMany({
        where: { albumId, isActive: true },
        data: {
          isActive: false,
          lastUpdateIp: audit.ip,
          lastUpdateBy: audit.updatedBy
        }
      }),
      this.prisma.albumAccessGrant.updateMany({
        where: { albumId, isActive: true },
        data: {
          isActive: false,
          lastUpdateIp: audit.ip,
          lastUpdateBy: audit.updatedBy
        }
      }),
      this.prisma.mediaAlbum.update({
        where: { id: albumId },
        data: {
          isActive: false,
          lastUpdateIp: audit.ip,
          lastUpdateBy: audit.updatedBy
        }
      })
    ]);

    return { ok: true };
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

    const lookup = dto.grantedToUserId.trim();
    const digits = lookup.replace(/\D/g, "");
    const grantee = await this.prisma.userAccount.findFirst({
      where: {
        isActive: true,
        OR: [
          { id: lookup },
          { email: lookup },
          { mobileNumber: lookup },
          ...(digits.length >= 10
            ? [{ mobileNumber: { contains: digits.slice(-10) } }]
            : [])
        ]
      }
    });
    if (!grantee) {
      throw new NotFoundException("User to grant access was not found");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + dto.grantedDays * 24 * 60 * 60 * 1000);
    return this.prisma.albumAccessGrant.upsert({
      where: {
        albumId_grantedToUserId: {
          albumId,
          grantedToUserId: grantee.id
        }
      },
      create: {
        albumId,
        grantedToUserId: grantee.id,
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
      },
      include: {
        grantedToUser: {
          select: { id: true, fullName: true, email: true, mobileNumber: true }
        }
      }
    });
  }

  listAccessGrants(ownerUserId: string, albumId: string) {
    return this.prisma.albumAccessGrant.findMany({
      where: {
        albumId,
        album: { ownerUserId },
        isActive: true
      },
      include: {
        grantedToUser: {
          select: { id: true, fullName: true, email: true, mobileNumber: true }
        }
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
