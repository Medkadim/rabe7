import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString, Length, MinLength } from "class-validator";

// Which app is signing this person in. Each of the three frontends hardcodes
// its own value server-side when it calls this endpoint (see each app's
// api/auth/login/route.ts) — it is never left for the browser to pick, so a
// driver or customer credential can't simply claim "admin" to get past the
// role check below.
export const LOGIN_AUDIENCES = ["admin", "driver", "storefront", "sales"] as const;
export type LoginAudience = (typeof LOGIN_AUDIENCES)[number];

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

  @ApiProperty({ enum: LOGIN_AUDIENCES, description: "Which app is signing this person in" })
  @IsIn(LOGIN_AUDIENCES)
  audience!: LoginAudience;
}
