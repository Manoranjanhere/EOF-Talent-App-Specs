import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf
} from "class-validator";

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "Mobile number (10-digit local or E.164, e.g. +919876543210)"
  })
  @IsString()
  @Length(8, 20)
  mobileNumber!: string;

  @ApiPropertyOptional({
    description: "Firebase ID token after successful phone OTP (production)."
  })
  @ValidateIf((o: RegisterDto) => !o.otpCode)
  @IsString()
  @Length(20, 4096)
  firebaseIdToken?: string;

  @ApiPropertyOptional({
    description: "Dev-only OTP when OTP_TEST_BYPASS=true."
  })
  @ValidateIf((o: RegisterDto) => !o.firebaseIdToken)
  @IsOptional()
  @IsString()
  @Length(4, 8)
  otpCode?: string;

  @ApiProperty()
  @IsString()
  @Length(8, 60)
  password!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  groupId!: number;
}
