import { ApiProperty } from "@nestjs/swagger";
import { FlagReason } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class FlagUserDto {
  @ApiProperty()
  @IsUUID()
  reportedUserId!: string;

  @ApiProperty({ enum: FlagReason })
  @IsEnum(FlagReason)
  reason!: FlagReason;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  details?: string;
}
