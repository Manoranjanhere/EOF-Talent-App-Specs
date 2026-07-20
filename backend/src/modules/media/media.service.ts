import {
  BadRequestException,
  Injectable
} from "@nestjs/common";
import { MediaAssetType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { StorageService } from "../storage/storage.service";
import { PresignUploadDto } from "./dto/presign-upload.dto";
import { CompleteProfilePhotoDto } from "./dto/complete-profile-photo.dto";

type AuditData = {
  ip: string;
  updatedBy: string;
};

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  presign(userId: string, dto: PresignUploadDto) {
    return this.storage.createUploadUrl({
      userId,
      contentType: dto.contentType,
      purpose: dto.purpose ?? "profile_photo"
    });
  }

  async uploadAndSetProfilePhoto(
    userId: string,
    file: Express.Multer.File,
    audit: AuditData
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Image file is required");
    }
    const contentType = file.mimetype || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      throw new BadRequestException("Profile photo must be an image");
    }

    const saved = await this.storage.saveBuffer({
      userId,
      purpose: "profile_photo",
      contentType,
      buffer: file.buffer
    });

    return this.completeProfilePhoto(
      userId,
      {
        objectKey: saved.objectKey,
        mimeType: contentType,
        sizeBytes: file.size
      },
      audit
    );
  }

  async completeProfilePhoto(
    userId: string,
    dto: CompleteProfilePhotoDto,
    audit: AuditData
  ) {
    if (!dto.objectKey.includes(`/${userId}/`)) {
      throw new BadRequestException("objectKey does not belong to this user");
    }
    if (!dto.objectKey.startsWith("profile_photo/")) {
      throw new BadRequestException("Invalid profile photo object key");
    }

    await this.prisma.mediaAsset.updateMany({
      where: { ownerUserId: userId, isProfilePhoto: true, isActive: true },
      data: {
        isProfilePhoto: false,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    const asset = await this.prisma.mediaAsset.create({
      data: {
        ownerUserId: userId,
        assetType: MediaAssetType.IMAGE,
        objectKey: dto.objectKey,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        isProfilePhoto: true,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    await this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        profilePhotoAssetId: asset.id,
        lastUpdateIp: audit.ip,
        lastUpdateBy: audit.updatedBy
      }
    });

    return {
      ...asset,
      url: await this.storage.getReadUrl(asset.objectKey)
    };
  }
}
