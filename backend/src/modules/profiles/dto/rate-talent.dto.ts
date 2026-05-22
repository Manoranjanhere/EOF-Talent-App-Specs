import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class RateTalentDto {
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
