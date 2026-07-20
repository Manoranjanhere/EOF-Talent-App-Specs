import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsString, Matches } from "class-validator";

export class PresignUploadDto {
  @ApiProperty({ example: "image/jpeg" })
  @IsString()
  @Matches(/^image\/(jpeg|jpg|png|webp)$/i, {
    message: "Only JPEG, PNG, or WebP images are allowed for profile photos"
  })
  contentType!: string;

  @ApiPropertyOptional({ enum: ["profile_photo", "album_asset"], default: "profile_photo" })
  @IsIn(["profile_photo", "album_asset"])
  purpose: "profile_photo" | "album_asset" = "profile_photo";
}
