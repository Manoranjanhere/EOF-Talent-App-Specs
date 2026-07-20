import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class SendMobileOtpDto {
  @ApiProperty()
  @IsString()
  @Length(8, 20)
  mobileNumber!: string;
}
