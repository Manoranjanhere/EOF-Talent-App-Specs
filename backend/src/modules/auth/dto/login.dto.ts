import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, Length } from "class-validator";

export class LoginDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  mobileNumber?: string;

  @ApiProperty()
  @IsString()
  @Length(8, 60)
  password!: string;
}
