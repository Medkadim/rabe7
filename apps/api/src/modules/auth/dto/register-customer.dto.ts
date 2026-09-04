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
  // "MA": this only operates in Morocco today, so a local number like
  // "0612345678" is accepted without a country code.
  @ApiProperty({ example: "0612345678", description: "Moroccan phone number" })
  @IsPhoneNumber("MA", { message: "Enter a valid Moroccan phone number (e.g. 0612345678)." })
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
