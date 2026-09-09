import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Audit } from "../../common/decorators/audit.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListsService } from "./lists.service";
import {
  AddListMemberDto,
  CreatePeopleListDto,
  ListMembersQuery,
  UpdatePeopleListDto
} from "./dto/people-list.dto";

@ApiTags("lists")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("lists")
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get("suggestions")
  suggestions() {
    return this.listsService.suggestions();
  }

  @Get()
  listMine(@CurrentUser() user: { userId: string }) {
    return this.listsService.listMine(user.userId);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreatePeopleListDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.listsService.create(user.userId, dto.title, audit);
  }

  @Get(":id")
  getOne(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Query() query: ListMembersQuery
  ) {
    return this.listsService.getOne(user.userId, id, query);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() dto: UpdatePeopleListDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.listsService.update(user.userId, id, dto.title, audit);
  }

  @Delete(":id")
  remove(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.listsService.remove(user.userId, id, audit);
  }

  @Post(":id/members")
  addMember(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() dto: AddListMemberDto,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.listsService.addMember(user.userId, id, dto.userId, audit);
  }

  @Delete(":id/members/:userId")
  removeMember(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Param("userId") memberUserId: string,
    @Audit() audit: { ip: string; updatedBy: string }
  ) {
    return this.listsService.removeMember(user.userId, id, memberUserId, audit);
  }
}
