import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class MobileOtpLoginDto {
  @ApiProperty()
  @IsString()
  @Length(8, 15)
  mobileNumber!: string;

  @ApiProperty({ description: "MVP OTP code. Default test code can be 123456." })
  @IsString()
  @Length(4, 8)
  otpCode!: string;
}
