import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { PaymentMethod } from "@prisma/client";

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  customerId!: string;

  @ApiPropertyOptional({ description: "Pay against a specific invoice" })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ description: "Cheque number, transfer reference, etc." })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
