import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  targetGroupId?: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  monthlyPriceInr!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  validityDays!: number;

  @ApiProperty({ default: false })
  @IsBoolean()
  isJobPostingPlan!: boolean;
}
