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
  MinLength,
  ValidateNested,
} from "class-validator";
import { CustomerSegment } from "@prisma/client";
import { CustomerAddressDto } from "./customer-address.dto";

export class CreateCustomerDto {
  // Optional: the admin's customer form still lets someone type their own
  // code. The sales app (reps recruiting a customer in the field) leaves it
  // out and CustomersService generates one the same way order numbers are —
  // a rep shouldn't have to invent a unique code on the spot.
  @ApiPropertyOptional({ description: "Short unique code, e.g. CUST-0001 — auto-generated if omitted" })
  @IsOptional()
  @IsString()
  code?: string;

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

  // Lets whoever creates this customer (typically a sales rep recruiting a
  // shop in the field) also set up their login right away, instead of
  // leaving them with no way to sign in until they separately self-register
  // on the storefront. Requires `phone` — the customer logs in with the
  // same phone-based flow every other retailer uses. The customer can
  // change it afterward via POST /auth/change-password.
  @ApiPropertyOptional({ description: "Temporary password — requires phone. Omit to create a customer with no login yet." })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ type: [CustomerAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerAddressDto)
  addresses?: CustomerAddressDto[];

  @ApiPropertyOptional({ description: "URL of a photo of the shop/premises, uploaded via /uploads/images" })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
