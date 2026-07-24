import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsOptional, IsPhoneNumber, IsString, MinLength, ValidateNested } from "class-validator";
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

  // The only required identifier — matches how customers actually sign up
  // in this market (a phone number, not necessarily an email address).
  @ApiProperty({ example: "+212612345678", description: "Include the country code" })
  @IsPhoneNumber(undefined, { message: "Enter a valid phone number, including the country code (e.g. +212612345678)." })
  phone!: string;

  @ApiProperty({ example: "correct-horse-battery-staple" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: "shop@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: "Where your orders should be delivered" })
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  address!: CustomerAddressDto;
}
