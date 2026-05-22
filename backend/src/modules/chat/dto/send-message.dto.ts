import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  messageText!: string;
}
