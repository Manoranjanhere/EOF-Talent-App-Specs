import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min
} from "class-validator";

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  @Length(2, 140)
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(400)
  miniDescription!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  ageRangeMin?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  ageRangeMax?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  payRangeMin?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  payRangeMax?: number;

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
