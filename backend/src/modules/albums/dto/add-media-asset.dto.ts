import { ApiProperty } from "@nestjs/swagger";
import { MediaAssetType } from "@prisma/client";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class AddMediaAssetDto {
  @ApiProperty({ enum: MediaAssetType })
  @IsEnum(MediaAssetType)
  assetType!: MediaAssetType;

  @ApiProperty()
  @IsString()
  objectKey!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  sizeBytes?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isProfilePhoto?: boolean;
}
