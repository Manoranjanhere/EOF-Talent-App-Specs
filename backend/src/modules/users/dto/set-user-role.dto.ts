import { ApiProperty } from "@nestjs/swagger";
import { GroupId } from "@eof/shared";
import { IsBoolean, IsIn, IsInt } from "class-validator";

const ADMIN_GROUP_IDS = [GroupId.Admin, GroupId.TeamAdmin, GroupId.SuperAdmin];

export class SetUserRoleDto {
  @ApiProperty({ enum: ADMIN_GROUP_IDS })
  @IsInt()
  @IsIn(ADMIN_GROUP_IDS)
  groupId!: number;

  @ApiProperty()
  @IsBoolean()
  grant!: boolean;
}
