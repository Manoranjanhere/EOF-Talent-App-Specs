import { ApiProperty } from "@nestjs/swagger";
import { JobApplicationStatus } from "../../../database/prisma-client";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: JobApplicationStatus })
  @IsEnum(JobApplicationStatus)
  status!: JobApplicationStatus;
}

export class CompleteApplicationDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  ratingValue!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comments?: string;
}
