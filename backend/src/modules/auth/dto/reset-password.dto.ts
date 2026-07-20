import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length, ValidateIf } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({ description: "Registered mobile number" })
  @IsString()
  @Length(8, 20)
  mobileNumber!: string;

  @ApiPropertyOptional({
    description: "Firebase ID token after successful phone OTP (production)."
  })
  @ValidateIf((o: ResetPasswordDto) => !o.otpCode)
  @IsString()
  @Length(20, 4096)
  firebaseIdToken?: string;

  @ApiPropertyOptional({
    description: "Dev-only OTP when OTP_TEST_BYPASS=true."
  })
  @ValidateIf((o: ResetPasswordDto) => !o.firebaseIdToken)
  @IsOptional()
  @IsString()
  @Length(4, 8)
  otpCode?: string;

  @ApiProperty()
  @IsString()
  @Length(8, 60)
  newPassword!: string;
}
