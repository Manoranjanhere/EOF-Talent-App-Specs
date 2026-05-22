import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, MaxLength } from "class-validator";

export class CreateFeedbackDto {
  @ApiProperty()
  @IsString()
  @Length(2, 140)
  subject!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  message!: string;
}
