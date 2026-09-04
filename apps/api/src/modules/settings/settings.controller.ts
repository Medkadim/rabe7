import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SettingsService } from "./settings.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

@ApiTags("settings")
@ApiBearerAuth()
@Controller({ path: "settings", version: "1" })
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // No @RequirePermissions here — every signed-in role (including a
  // customer on the storefront) needs to read this to show the banner.
  @Get()
  @ApiOperation({ summary: "Store-wide settings (currently just the storefront home banner)" })
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.get(user.tenantId);
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  @ApiOperation({ summary: "Admin: set or clear the storefront home banner" })
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(user.tenantId, dto);
  }
}
