import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, Length } from "class-validator";

export class GrantAlbumAccessDto {
  @ApiProperty({
    description: "User UUID, email, or mobile number of the member/agency"
  })
  @IsString()
  @Length(3, 120)
  grantedToUserId!: string;

  @ApiProperty({ enum: [30, 60, 90], default: 30 })
  @IsIn([30, 60, 90])
  grantedDays!: 30 | 60 | 90;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
