import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { CustomerSegment } from "@prisma/client";
import { CustomerAddressDto } from "./customer-address.dto";

export class CreateCustomerDto {
  @ApiProperty({ description: "Short unique code, e.g. CUST-0001" })
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: CustomerSegment, default: CustomerSegment.RETAIL })
  @IsOptional()
  @IsEnum(CustomerSegment)
  segment?: CustomerSegment;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  paymentTermsDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedRepId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CustomerAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerAddressDto)
  addresses?: CustomerAddressDto[];
}
