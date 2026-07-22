import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { WarehouseService } from "./warehouse.service";
import { ReceiveStockDto } from "./dto/receive-stock.dto";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { CreateReturnDto } from "./dto/create-return.dto";
import { ReceiveReturnDto } from "./dto/receive-return.dto";
import { QueryMovementsDto } from "./dto/query-movements.dto";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

@ApiTags("warehouse")
@ApiBearerAuth()
@Controller({ path: "warehouse", version: "1" })
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post("receiving")
  @RequirePermissions(PERMISSIONS.WAREHOUSE_RECEIVE)
  @ApiOperation({ summary: "Record incoming stock" })
  receiveStock(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReceiveStockDto) {
    return this.warehouseService.receiveStock(user.tenantId, user.userId, dto);
  }

  @Post("adjustments")
  @RequirePermissions(PERMISSIONS.WAREHOUSE_ADJUST)
  @ApiOperation({ summary: "Manually correct a stock count" })
  adjustStock(@CurrentUser() user: AuthenticatedUser, @Body() dto: AdjustStockDto) {
    return this.warehouseService.adjustStock(user.tenantId, user.userId, dto);
  }

  @Post("orders/:orderId/pick")
  @RequirePermissions(PERMISSIONS.WAREHOUSE_PICK)
  @ApiOperation({ summary: "Pick a confirmed order (decrements stock, moves it to PROCESSING)" })
  pickOrder(@CurrentUser() user: AuthenticatedUser, @Param("orderId") orderId: string) {
    return this.warehouseService.pickOrder(user.tenantId, user.userId, orderId);
  }

  @Get("movements")
  @RequirePermissions(PERMISSIONS.WAREHOUSE_READ)
  @ApiOperation({ summary: "List stock movement history" })
  listMovements(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryMovementsDto) {
    return this.warehouseService.listMovements(user.tenantId, query);
  }

  @Get("low-stock")
  @RequirePermissions(PERMISSIONS.WAREHOUSE_READ)
  @ApiOperation({ summary: "List products at or below their minimum stock level" })
  lowStock(@CurrentUser() user: AuthenticatedUser) {
    return this.warehouseService.lowStock(user.tenantId);
  }

  @Post("returns")
  @RequirePermissions(PERMISSIONS.RETURNS_CREATE)
  @ApiOperation({ summary: "Log a customer return" })
  createReturn(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReturnDto) {
    return this.warehouseService.createReturn(user.tenantId, user.userId, dto);
  }

  @Get("returns")
  @RequirePermissions(PERMISSIONS.RETURNS_READ)
  @ApiOperation({ summary: "List customer returns" })
  listReturns(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.warehouseService.listReturns(user.tenantId, query);
  }

  @Patch("returns/:id")
  @RequirePermissions(PERMISSIONS.RETURNS_RECEIVE)
  @ApiOperation({ summary: "Receive a return: restock sellable items, reject the rest" })
  receiveReturn(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ReceiveReturnDto,
  ) {
    return this.warehouseService.receiveReturn(user.tenantId, user.userId, id, dto.status);
  }
}
