import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { StatsService } from "./stats.service";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

@ApiTags("stats")
@ApiBearerAuth()
@Controller({ path: "stats", version: "1" })
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get("overview")
  @RequirePermissions(PERMISSIONS.REPORTS_READ)
  @ApiOperation({ summary: "Revenue, top products/customers, and order breakdown for a chosen period" })
  getOverview(@CurrentUser() user: AuthenticatedUser, @Query("from") from?: string, @Query("to") to?: string) {
    return this.statsService.getOverview(user.tenantId, from, to);
  }

  @Get("platform-fee")
  @RequirePermissions(PERMISSIONS.PLATFORM_FEE_READ)
  @ApiOperation({ summary: "The platform's 1% commission on delivered orders for a chosen period" })
  getPlatformFee(@CurrentUser() user: AuthenticatedUser, @Query("from") from?: string, @Query("to") to?: string) {
    return this.statsService.getPlatformFee(user.tenantId, from, to);
  }
}
