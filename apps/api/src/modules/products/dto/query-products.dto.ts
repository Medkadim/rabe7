import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBooleanString, IsEnum, IsOptional, IsString } from "class-validator";
import { ProductStatus } from "@prisma/client";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QueryProductsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ description: "Filter to only featured products" })
  @IsOptional()
  @IsBooleanString()
  featured?: string;
}
