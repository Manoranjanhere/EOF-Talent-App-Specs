import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class MemberSearchQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== "" ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  groupId?: number;

  @ApiPropertyOptional({ description: "Comma separated tag IDs" })
  @IsOptional()
  @IsString()
  tagIds?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== "" ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== "" ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  pageSize?: number;
}
