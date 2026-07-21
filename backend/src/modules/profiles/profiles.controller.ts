import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ProfilesService } from "./profiles.service";
import { UpdateTalentProfileDto } from "./dto/update-talent-profile.dto";
import { UpdateOrgProfileDto } from "./dto/update-org-profile.dto";
import { SetProfileTagsDto } from "./dto/set-profile-tags.dto";
import { RateTalentDto } from "./dto/rate-talent.dto";

@ApiTags("profiles")
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /** Must be registered before :userId so "org-types" is not captured as an id. */
  @Get("org-types")
  listOrgTypes() {
    return this.profilesService.listOrgTypes();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(":userId")
  getProfile(
    @CurrentUser() user: { userId: string },
    @Param("userId") userId: string
  ) {
    return this.profilesService.getUserProfile(userId, user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch("talent/me")
  updateTalentProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateTalentProfileDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.profilesService.updateTalentProfile(user.userId, dto, audit);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch("org/me")
  updateOrgProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateOrgProfileDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.profilesService.updateOrgProfile(user.userId, dto, audit);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("tags/me")
  setProfileTags(
    @CurrentUser() user: { userId: string },
    @Body() dto: SetProfileTagsDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.profilesService.setProfileTags(user.userId, dto, audit);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(":userId/rate")
  rateTalent(
    @CurrentUser() user: { userId: string },
    @Param("userId") targetUserId: string,
    @Body() dto: RateTalentDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.profilesService.rateTalent(user.userId, targetUserId, dto, audit);
  }
}
