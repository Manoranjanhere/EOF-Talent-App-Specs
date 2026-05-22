import { ApiProperty } from "@nestjs/swagger";
import { PurchaseType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

export class PurchaseSubscriptionDto {
  @ApiProperty()
  @IsUUID()
  planId!: string;

  @ApiProperty({ enum: PurchaseType })
  @IsEnum(PurchaseType)
  purchaseType!: PurchaseType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  purchaseRef?: string;
}
