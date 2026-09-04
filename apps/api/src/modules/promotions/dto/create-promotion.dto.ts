import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from "class-validator";
import { PromotionType } from "@prisma/client";

export class CreatePromotionDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PromotionType })
  @IsEnum(PromotionType)
  type!: PromotionType;

  @ApiPropertyOptional({ description: "Required for PERCENTAGE and VOLUME_DISCOUNT (as a percentage)" })
  @ValidateIf((dto) => dto.type === PromotionType.PERCENTAGE || dto.type === PromotionType.VOLUME_DISCOUNT)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({ description: "Required for FIXED_AMOUNT" })
  @ValidateIf((dto) => dto.type === PromotionType.FIXED_AMOUNT)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: "Required for VOLUME_DISCOUNT — the quantity threshold to unlock the discount" })
  @ValidateIf((dto) => dto.type === PromotionType.VOLUME_DISCOUNT)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ description: "Required for BUY_X_GET_Y — same as minQuantity, the trigger quantity" })
  @ValidateIf((dto) => dto.type === PromotionType.BUY_X_GET_Y)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  buyQuantity?: number;

  @ApiPropertyOptional({ description: "Required for BUY_X_GET_Y — how many free/reward units are given" })
  @ValidateIf((dto) => dto.type === PromotionType.BUY_X_GET_Y)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  getQuantity?: number;

  @ApiPropertyOptional({ description: "Required for BUY_X_GET_Y — the product given as the reward/gift" })
  @ValidateIf((dto) => dto.type === PromotionType.BUY_X_GET_Y)
  @IsString()
  rewardProductId?: string;

  @ApiPropertyOptional({ description: "Restrict to customers in this region (matches any of their addresses)" })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty()
  @IsDateString()
  startsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiProperty({ type: [String], description: "Products this promotion applies to" })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  productIds!: string[];

  @ApiPropertyOptional({ type: [String], description: "Leave empty to apply to every customer" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customerIds?: string[];
}
