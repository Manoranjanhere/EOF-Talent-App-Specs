import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, IsUUID } from "class-validator";

export class GrantAlbumAccessDto {
  @ApiProperty()
  @IsUUID()
  grantedToUserId!: string;

  @ApiProperty({ enum: [30, 60, 90], default: 30 })
  @IsIn([30, 60, 90])
  grantedDays!: 30 | 60 | 90;

  @ApiProperty({ required: false })
  @IsString()
  reason?: string;
}
