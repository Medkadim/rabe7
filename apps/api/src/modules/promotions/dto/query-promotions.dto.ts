import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBooleanString, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QueryPromotionsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Filter to only currently-active promotions" })
  @IsOptional()
  @IsBooleanString()
  active?: string;
}
