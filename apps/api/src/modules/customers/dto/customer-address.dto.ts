import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsLatitude, IsLongitude, IsOptional, IsString } from "class-validator";

export class CustomerAddressDto {
  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty()
  @IsString()
  line1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty()
  @IsString()
  country!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  lng?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
