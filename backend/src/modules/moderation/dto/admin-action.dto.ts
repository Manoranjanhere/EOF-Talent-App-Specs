import { ApiProperty } from "@nestjs/swagger";
import { ActionType, FlagStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class AdminActionDto {
  @ApiProperty()
  @IsUUID()
  reportId!: string;

  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  actionType!: ActionType;

  @ApiProperty({ enum: FlagStatus, default: FlagStatus.ACTIONED })
  @IsEnum(FlagStatus)
  reportStatus!: FlagStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  notes?: string;
}
