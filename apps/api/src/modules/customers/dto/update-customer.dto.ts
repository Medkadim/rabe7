import { ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType, OmitType } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { CustomerStatus } from "@prisma/client";
import { CreateCustomerDto } from "./create-customer.dto";

export class UpdateCustomerDto extends PartialType(
  OmitType(CreateCustomerDto, ["addresses"] as const),
) {
  @ApiPropertyOptional({ enum: CustomerStatus })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}
