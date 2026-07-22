import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class QueryPaymentsDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;
}
