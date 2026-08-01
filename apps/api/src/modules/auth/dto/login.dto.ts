import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Length, MinLength } from "class-validator";

export class LoginDto {
  // Staff sign in with email, customers with phone — this one field takes
  // either, and AuthService.login tries both. Not validated as email/phone
  // specifically since it has to accept both shapes.
  @ApiProperty({ example: "manager@distributor.com or 0612345678" })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

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
