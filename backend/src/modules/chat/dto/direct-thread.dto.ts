import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class DirectThreadDto {
  @ApiProperty()
  @IsUUID()
  recipientUserId!: string;
}
