import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SystemRoleCode } from "@prisma/client";
import { StaffService } from "./staff.service";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

@ApiTags("staff")
@ApiBearerAuth()
@Controller({ path: "staff", version: "1" })
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  @ApiOperation({ summary: "Create a staff account (sales rep, warehouse, driver, admin...)" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStaffDto) {
    return this.staffService.create(user.tenantId, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  @ApiOperation({ summary: "List staff accounts, optionally filtered by role" })
  list(@CurrentUser() user: AuthenticatedUser, @Query("role") role?: SystemRoleCode) {
    return this.staffService.list(user.tenantId, role);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Deactivate a staff account" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.staffService.remove(user.tenantId, id);
  }

  @Post(":id/reactivate")
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Reactivate a previously deactivated staff account" })
  async reactivate(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.staffService.reactivate(user.tenantId, id);
  }

  @Delete(":id/permanent")
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Permanently delete a deactivated staff account with no activity on record" })
  async hardDelete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.staffService.hardDelete(user.tenantId, id);
  }
}
