import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";

// Deliberately its own DTO, not CreateProductDto — a bulk import from a
// spreadsheet of historical data has no product photos yet (those get
// added per-product afterward), so this never carries the
// "at least 3 images" rule that applies when someone adds a single
// product by hand.
export class BulkImportProductRowDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: "Matched or created by name" })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiProperty({ description: 'e.g. "12 pcs", "case"' })
  @IsString()
  unit!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional({ description: "What the distributor pays — staff-only" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;
}

export class BulkImportProductsDto {
  @ApiProperty({ type: [BulkImportProductRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkImportProductRowDto)
  products!: BulkImportProductRowDto[];
}
