import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class ReferJobDto {
  @ApiProperty()
  @IsUUID("4")
  recipientUserId!: string;
}
