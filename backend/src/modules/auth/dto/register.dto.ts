import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsInt, IsOptional, IsString, Length, Min } from "class-validator";

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(8, 15)
  mobileNumber?: string;

  @ApiProperty()
  @IsString()
  @Length(8, 60)
  password!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  groupId!: number;
}
