import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { memoryStorage } from "multer";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { MediaService } from "./media.service";
import { PresignUploadDto } from "./dto/presign-upload.dto";
import { CompleteProfilePhotoDto } from "./dto/complete-profile-photo.dto";

@ApiTags("media")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("presign")
  presign(
    @CurrentUser() user: { userId: string },
    @Body() dto: PresignUploadDto
  ) {
    return this.mediaService.presign(user.userId, dto);
  }

  @Post("profile-photo")
  completeProfilePhoto(
    @CurrentUser() user: { userId: string },
    @Body() dto: CompleteProfilePhotoDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.mediaService.completeProfilePhoto(user.userId, dto, audit);
  }

  @Post("profile-photo/upload")
  @SkipThrottle()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } }
    }
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 }
    })
  )
  uploadProfilePhoto(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: Express.Multer.File,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.mediaService.uploadAndSetProfilePhoto(user.userId, file, audit);
  }
}
