import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, Min } from "class-validator";

export class SetSalesTargetDto {
  @ApiPropertyOptional({ description: "Daily CA (revenue) objective" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  dailyTarget?: number;

  @ApiPropertyOptional({ description: "Weekly CA (revenue) objective" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weeklyTarget?: number;

  @ApiPropertyOptional({ description: "Monthly CA (revenue) objective" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyTarget?: number;
}
