import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { QueryPaymentsDto } from "./dto/query-payments.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

@ApiTags("payments")
@ApiBearerAuth()
@Controller({ path: "payments", version: "1" })
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.PAYMENTS_CREATE)
  @ApiOperation({ summary: "Record a payment (cash, transfer, cheque or credit)" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(user.tenantId, user.userId, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PAYMENTS_READ)
  @ApiOperation({ summary: "List payments, optionally filtered by customer" })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryPaymentsDto) {
    return this.paymentsService.findAll(user.tenantId, query);
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.PAYMENTS_READ)
  @ApiOperation({ summary: "Get a payment receipt" })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.paymentsService.findOne(user.tenantId, id);
  }
}
