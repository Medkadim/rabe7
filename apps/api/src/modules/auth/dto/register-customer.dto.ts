import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { CustomerAddressDto } from "../../customers/dto/customer-address.dto";

export class RegisterCustomerDto {
  @ApiProperty({ description: "Your shop or business name" })
  @IsString()
  businessName!: string;

  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiProperty({ example: "shop@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "correct-horse-battery-staple" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: "Where your orders should be delivered" })
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  address!: CustomerAddressDto;
}
