import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Length, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "manager@distributor.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "correct-horse-battery-staple" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ description: "6-digit code from the authenticator app, required only if 2FA is enabled" })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  twoFactorCode?: string;
}
