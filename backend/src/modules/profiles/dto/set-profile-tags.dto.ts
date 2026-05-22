import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from "class-validator";

export class SetProfileTagsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  primaryTagIds!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  secondaryTagIds!: string[];
}
