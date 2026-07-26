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

  @ApiProperty({
    required: false,
    description: "Audit / store receipt id (Play order id preferred)"
  })
  @IsOptional()
  @IsString()
  purchaseRef?: string;

  @ApiProperty({
    required: false,
    description: "Google Play purchase token (required for PAID)"
  })
  @IsOptional()
  @IsString()
  googlePlayPurchaseToken?: string;

  @ApiProperty({
    required: false,
    description: "Play Console product / subscription id"
  })
  @IsOptional()
  @IsString()
  googlePlayProductId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  googlePlayPackageName?: string;
}
