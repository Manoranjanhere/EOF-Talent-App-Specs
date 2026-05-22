import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, Length, MaxLength } from "class-validator";

export class UpdateTalentProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  age?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  country?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  snapchatUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  youtubeUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tiktokUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  miniBio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  lookingForWork?: boolean;
}
