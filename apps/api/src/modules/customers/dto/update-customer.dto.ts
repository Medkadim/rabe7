import { ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType, OmitType } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { CustomerStatus } from "@prisma/client";
import { CreateCustomerDto } from "./create-customer.dto";

export class UpdateCustomerDto extends PartialType(
  // password is create-only — it's how a temporary login gets set up, not
  // something to silently accept (and ignore, since Customer has no such
  // column) on a later edit. Changing a password happens through
  // POST /auth/change-password instead.
  OmitType(CreateCustomerDto, ["addresses", "password"] as const),
) {
  @ApiPropertyOptional({ enum: CustomerStatus })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}
