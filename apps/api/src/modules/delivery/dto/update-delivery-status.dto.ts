import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { DeliveryStatus } from "@prisma/client";

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: DeliveryStatus })
  @IsEnum(DeliveryStatus)
  status!: DeliveryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiPropertyOptional({ description: "Cash collected on delivery — automatically recorded as a payment" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cashCollected?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proofPhotoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
