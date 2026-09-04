import { Body, Controller, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { OrdersService } from "./orders.service";
import { OrderPdfService } from "./order-pdf.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { QueryOrdersDto } from "./dto/query-orders.dto";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

@ApiTags("orders")
@ApiBearerAuth()
@Controller({ path: "orders", version: "1" })
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderPdfService: OrderPdfService,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.ORDERS_CREATE)
  @ApiOperation({ summary: "Create a draft order" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.tenantId, user.userId, dto, user.customerId);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: "List orders with filtering and pagination" })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryOrdersDto) {
    return this.ordersService.findAll(user.tenantId, query, user.customerId);
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: "Get an order, its items and status timeline" })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.ordersService.findOne(user.tenantId, id, user.customerId);
  }

  @Get(":id/pdf")
  @RequirePermissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: "Download the order as a PDF" })
  async downloadPdf(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Res() res: Response) {
    const pdf = await this.orderPdfService.render(user.tenantId, id, user.customerId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="order-${id}.pdf"`);
    res.send(pdf);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.ORDERS_UPDATE)
  @ApiOperation({ summary: "Edit a draft or pending order" })
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(user.tenantId, id, user.userId, dto, user.customerId);
  }

  @Post(":id/confirm")
  @RequirePermissions(PERMISSIONS.ORDERS_UPDATE)
  @ApiOperation({ summary: "Confirm an order (runs the credit-limit check and creates its invoice)" })
  confirm(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.ordersService.confirm(user.tenantId, id, user.userId, user.customerId);
  }

  @Post(":id/cancel")
  @RequirePermissions(PERMISSIONS.ORDERS_CANCEL)
  @ApiOperation({ summary: "Cancel an order" })
  cancel(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CancelOrderDto) {
    return this.ordersService.cancel(user.tenantId, id, user.userId, dto.reason, user.customerId);
  }

  @Post(":id/duplicate")
  @RequirePermissions(PERMISSIONS.ORDERS_CREATE)
  @ApiOperation({ summary: "Create a new draft order copying another order's items" })
  duplicate(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.ordersService.duplicate(user.tenantId, id, user.userId, user.customerId);
  }
}
