import { ApiProperty } from "@nestjs/swagger";
import { AlbumVisibility } from "@prisma/client";
import { IsEnum, IsString, Length } from "class-validator";

export class CreateAlbumDto {
  @ApiProperty()
  @IsString()
  @Length(2, 120)
  title!: string;

  @ApiProperty({ enum: AlbumVisibility })
  @IsEnum(AlbumVisibility)
  visibility!: AlbumVisibility;
}
