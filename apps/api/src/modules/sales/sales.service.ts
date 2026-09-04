import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SetSalesTargetDto } from "./dto/set-sales-target.dto";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Monday-based week, matching the local business week.
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "DELIVERED"] as const;

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  private async achievedBetween(tenantId: string, userId: string, from: Date, to: Date): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        tenantId,
        createdByUserId: userId,
        status: { in: [...ACTIVE_STATUSES] },
        createdAt: { gte: from, lte: to },
      },
      _sum: { total: true },
    });
    return Number(result._sum.total ?? 0);
  }

  async getTargets(tenantId: string, userId: string) {
    const target = await this.prisma.salesTarget.findUnique({ where: { userId } });
    if (target && target.tenantId !== tenantId) {
      throw new BadRequestException("Sales target not found for this user.");
    }
    return {
      dailyTarget: Number(target?.dailyTarget ?? 0),
      weeklyTarget: Number(target?.weeklyTarget ?? 0),
      monthlyTarget: Number(target?.monthlyTarget ?? 0),
    };
  }

  async setTargets(tenantId: string, userId: string, dto: SetSalesTargetDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId, deletedAt: null } });
    if (!user) {
      throw new BadRequestException("Staff account not found.");
    }

    const target = await this.prisma.salesTarget.upsert({
      where: { userId },
      create: {
        tenantId,
        userId,
        dailyTarget: dto.dailyTarget ?? 0,
        weeklyTarget: dto.weeklyTarget ?? 0,
        monthlyTarget: dto.monthlyTarget ?? 0,
      },
      update: {
        dailyTarget: dto.dailyTarget,
        weeklyTarget: dto.weeklyTarget,
        monthlyTarget: dto.monthlyTarget,
      },
    });

    return {
      dailyTarget: Number(target.dailyTarget),
      weeklyTarget: Number(target.weeklyTarget),
      monthlyTarget: Number(target.monthlyTarget),
    };
  }

  async getDashboard(tenantId: string, userId: string, from?: string, to?: string) {
    const targets = await this.getTargets(tenantId, userId);

    const now = new Date();
    const todayFrom = startOfDay(now);
    const todayTo = endOfDay(now);
    const weekFrom = startOfWeek(now);
    const monthFrom = startOfMonth(now);

    const periodFrom = from ? startOfDay(new Date(from)) : todayFrom;
    const periodTo = to ? endOfDay(new Date(to)) : todayTo;
    if (Number.isNaN(periodFrom.getTime()) || Number.isNaN(periodTo.getTime())) {
      throw new BadRequestException("Invalid date range.");
    }

    const [achievedToday, achievedWeek, achievedMonth, achievedPeriod] = await Promise.all([
      this.achievedBetween(tenantId, userId, todayFrom, todayTo),
      this.achievedBetween(tenantId, userId, weekFrom, todayTo),
      this.achievedBetween(tenantId, userId, monthFrom, todayTo),
      this.achievedBetween(tenantId, userId, periodFrom, periodTo),
    ]);

    return {
      targets,
      today: { achieved: achievedToday },
      week: { achieved: achievedWeek },
      month: { achieved: achievedMonth },
      period: { from: periodFrom.toISOString(), to: periodTo.toISOString(), achieved: achievedPeriod },
    };
  }
}
