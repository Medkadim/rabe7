import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(tenantId: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { bannerImageUrl: true },
    });
    return { bannerImageUrl: tenant.bannerImageUrl };
  }

  async update(tenantId: string, dto: UpdateSettingsDto) {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { bannerImageUrl: dto.bannerImageUrl ? dto.bannerImageUrl : null },
      select: { bannerImageUrl: true },
    });
    return { bannerImageUrl: tenant.bannerImageUrl };
  }
}
