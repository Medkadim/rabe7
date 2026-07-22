import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsString, MinLength, NotEquals } from "class-validator";

export class AdjustStockDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty({ description: "Signed change, e.g. -3 for a shrinkage correction, +3 to add stock back" })
  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  quantity!: number;

  @ApiProperty({ description: "Why this correction is being made — required for the audit trail" })
  @IsString()
  @MinLength(3)
  note!: string;
}
