import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { memoryStorage } from "multer";
import { GroupId } from "@eof/shared";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AlbumsService } from "./albums.service";
import { CreateAlbumDto } from "./dto/create-album.dto";
import { AddMediaAssetDto } from "./dto/add-media-asset.dto";
import { GrantAlbumAccessDto } from "./dto/grant-album-access.dto";

@ApiTags("albums")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GroupId.Talent, GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin)
@Controller("albums")
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get("mine")
  listMine(@CurrentUser() user: { userId: string }) {
    return this.albumsService.listMyAlbums(user.userId);
  }

  /** Employers (and others) can browse a talent's visible albums. */
  @Get("user/:userId")
  @Roles(
    GroupId.Talent,
    GroupId.TalentEmployerOrAgency,
    GroupId.Admin,
    GroupId.TeamAdmin,
    GroupId.SuperAdmin
  )
  listForUser(
    @CurrentUser() user: { userId: string },
    @Param("userId") userId: string
  ) {
    return this.albumsService.listVisibleAlbumsForUser(user.userId, userId);
  }

  @Get(":albumId/view")
  @Roles(
    GroupId.Talent,
    GroupId.TalentEmployerOrAgency,
    GroupId.Admin,
    GroupId.TeamAdmin,
    GroupId.SuperAdmin
  )
  viewAlbum(
    @CurrentUser() user: { userId: string },
    @Param("albumId") albumId: string
  ) {
    return this.albumsService.getAlbumForViewer(user.userId, albumId);
  }

  @Get(":albumId")
  getAlbum(
    @CurrentUser() user: { userId: string },
    @Param("albumId") albumId: string
  ) {
    return this.albumsService.getAlbum(user.userId, albumId);
  }

  @Post()
  createAlbum(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateAlbumDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.albumsService.createAlbum(user.userId, dto, audit);
  }

  @Post(":albumId/assets")
  addAsset(
    @CurrentUser() user: { userId: string },
    @Param("albumId") albumId: string,
    @Body() dto: AddMediaAssetDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.albumsService.addAsset(user.userId, albumId, dto, audit);
  }

  @Post(":albumId/assets/upload")
  @SkipThrottle()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        thumbnail: { type: "string", format: "binary" }
      }
    }
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "file", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
      ],
      {
        storage: memoryStorage(),
        // Videos can be large; allow up to 200MB per file (+ separate thumbnail field).
        limits: { fileSize: 200 * 1024 * 1024, files: 2 }
      }
    )
  )
  uploadAsset(
    @CurrentUser() user: { userId: string },
    @Param("albumId") albumId: string,
    @UploadedFiles()
    files: { file?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    const file = files?.file?.[0];
    if (!file) {
      throw new BadRequestException("Media file is required");
    }
    return this.albumsService.addUploadedAsset(user.userId, albumId, file, audit, {
      thumbnail: files?.thumbnail?.[0]
    });
  }

  @Post(":albumId/access-grants")
  grantAccess(
    @CurrentUser() user: { userId: string },
    @Param("albumId") albumId: string,
    @Body() dto: GrantAlbumAccessDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.albumsService.grantPrivateAccess(user.userId, albumId, dto, audit);
  }

  @Get(":albumId/access-grants")
  listAccessGrants(
    @CurrentUser() user: { userId: string },
    @Param("albumId") albumId: string
  ) {
    return this.albumsService.listAccessGrants(user.userId, albumId);
  }

  @Delete("access-grants/:grantId")
  revokeAccess(
    @CurrentUser() user: { userId: string },
    @Param("grantId") grantId: string,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.albumsService.revokeAccess(user.userId, grantId, audit);
  }

  @Delete(":albumId/assets/:assetId")
  deleteAsset(
    @CurrentUser() user: { userId: string },
    @Param("albumId") albumId: string,
    @Param("assetId") assetId: string,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.albumsService.softDeleteAsset(user.userId, albumId, assetId, audit);
  }

  @Delete(":albumId")
  deleteAlbum(
    @CurrentUser() user: { userId: string },
    @Param("albumId") albumId: string,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.albumsService.softDeleteAlbum(user.userId, albumId, audit);
  }
}
