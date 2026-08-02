import { Body, Controller, Get, Param, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SalesService } from "./sales.service";
import { SetSalesTargetDto } from "./dto/set-sales-target.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

@ApiTags("sales")
@ApiBearerAuth()
@Controller({ path: "sales", version: "1" })
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get("dashboard")
  @RequirePermissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: "A sales rep's own CA objective vs achieved, for today and a chosen period" })
  getDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.salesService.getDashboard(user.tenantId, user.userId, from, to);
  }

  @Get("targets/:userId")
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  @ApiOperation({ summary: "Admin: read a sales rep's current CA objectives" })
  getTargets(@CurrentUser() user: AuthenticatedUser, @Param("userId") userId: string) {
    return this.salesService.getTargets(user.tenantId, userId);
  }

  @Put("targets/:userId")
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  @ApiOperation({ summary: "Admin: set a sales rep's daily/weekly/monthly CA objectives" })
  setTargets(
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId") userId: string,
    @Body() dto: SetSalesTargetDto,
  ) {
    return this.salesService.setTargets(user.tenantId, userId, dto);
  }
}
