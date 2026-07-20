import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsInt, IsOptional, IsString, Length } from "class-validator";

export class UpdateOrgProfileDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  orgTypeId!: number;

  @ApiProperty({ description: "Organization / company name" })
  @IsString()
  @Length(2, 160)
  legalName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contactPosition?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiProperty({ required: false, description: "Optional Instagram profile URL" })
  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @ApiProperty({ required: false, description: "Optional Facebook profile URL" })
  @IsOptional()
  @IsString()
  facebookUrl?: string;
}
