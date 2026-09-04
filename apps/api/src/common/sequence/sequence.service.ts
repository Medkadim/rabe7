import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  // Postgres's ON CONFLICT DO UPDATE ... RETURNING is atomic, so two orders
  // created in the same millisecond still get distinct, gap-free numbers —
  // a plain "count the rows and add one" approach would race under load.
  async next(tenantId: string, key: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ value: number }[]>`
      INSERT INTO sequence_counters ("tenantId", "key", "value")
      VALUES (${tenantId}, ${key}, 1)
      ON CONFLICT ("tenantId", "key")
      DO UPDATE SET "value" = sequence_counters."value" + 1
      RETURNING "value"
    `;
    return rows[0].value;
  }

  formatNumber(prefix: string, value: number, padding = 6): string {
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${String(value).padStart(padding, "0")}`;
  }
}
