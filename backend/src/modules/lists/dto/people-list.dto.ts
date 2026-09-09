import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, Length } from "class-validator";

export class CreatePeopleListDto {
  @ApiProperty()
  @IsString()
  @Length(2, 80)
  title!: string;
}

export class UpdatePeopleListDto {
  @ApiProperty()
  @IsString()
  @Length(2, 80)
  title!: string;
}

export class AddListMemberDto {
  @ApiProperty()
  @IsUUID("4")
  userId!: string;
}

export class ListMembersQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: "Comma separated tag IDs" })
  @IsOptional()
  @IsString()
  tagIds?: string;
}
