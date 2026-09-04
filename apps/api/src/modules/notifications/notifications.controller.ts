import { Body, Controller, Delete, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.service";
import { RegisterDeviceDto } from "./dto/register-device.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller({ path: "notifications", version: "1" })
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  // No @RequirePermissions — any signed-in account (staff or customer) can
  // register its own device; there's nothing to gate.
  @Post("register-device")
  @ApiOperation({ summary: "Register (or refresh) this device's push token for the signed-in account" })
  async registerDevice(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDeviceDto) {
    // The token is the natural key, not (tenant, user) — the same physical
    // device can only ever belong to whoever is currently signed in on it,
    // so a re-registration under a different account reassigns it instead
    // of leaving a stale duplicate pointed at the old one.
    await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: { tenantId: user.tenantId, userId: user.userId, token: dto.token, platform: dto.platform },
      update: { tenantId: user.tenantId, userId: user.userId, platform: dto.platform },
    });
    return { registered: true };
  }

  @Delete("register-device")
  @ApiOperation({ summary: "Unregister this device's push token (e.g. on sign out)" })
  async unregisterDevice(@Body() dto: RegisterDeviceDto) {
    await this.prisma.deviceToken.deleteMany({ where: { token: dto.token } });
    return { unregistered: true };
  }
}
