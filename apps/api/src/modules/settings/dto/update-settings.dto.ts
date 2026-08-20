import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateSettingsDto {
  // An empty string clears the custom banner (the storefront falls back to
  // its generated one) — kept as a plain string rather than nullable so the
  // DTO stays simple; the service treats "" the same as "not set".
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerImageUrl?: string;
}
