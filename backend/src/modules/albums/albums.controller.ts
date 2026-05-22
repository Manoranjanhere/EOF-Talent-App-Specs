import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AlbumsService } from "./albums.service";
import { CreateAlbumDto } from "./dto/create-album.dto";
import { AddMediaAssetDto } from "./dto/add-media-asset.dto";
import { GrantAlbumAccessDto } from "./dto/grant-album-access.dto";

@ApiTags("albums")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("albums")
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

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
}
