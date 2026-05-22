import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class BlockUserDto {
  @ApiProperty()
  @IsUUID()
  blockedUserId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  reason?: string;
}
