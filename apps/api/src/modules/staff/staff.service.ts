import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { SystemRoleCode } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { normalizePhone } from "../auth/utils/phone.util";
import { CreateStaffDto, STAFF_ROLE_CODES } from "./dto/create-staff.dto";

// passwordHash is deliberately never in this list — this record reaches
// the admin UI's staff screen, which has no business seeing it.
const STAFF_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  roles: { include: { role: true } },
} as const;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateStaffDto) {
    if (!STAFF_ROLE_CODES.includes(dto.roleCode as (typeof STAFF_ROLE_CODES)[number])) {
      throw new BadRequestException("A customer login is created by self-registration, not here.");
    }

    const existing = await this.prisma.user.findFirst({
      where: { tenantId, deletedAt: null, email: dto.email },
    });
    if (existing) {
      throw new ConflictException(`A staff account with email "${dto.email}" already exists.`);
    }

    // Stored in the same normalized E.164 form AuthService.login compares
    // against — a sales rep signs in by phone number, so whatever shape
    // gets written here has to be exactly what a later phone lookup
    // produces, the same reasoning as the customer self-registration flow.
    let normalizedPhone: string | null = null;
    if (dto.phone) {
      normalizedPhone = normalizePhone(dto.phone);
      if (!normalizedPhone) {
        throw new BadRequestException("Enter a valid Moroccan phone number (e.g. 0612345678).");
      }
    }

    const role = await this.prisma.role.findFirstOrThrow({ where: { tenantId, code: dto.roleCode } });
    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        phone: normalizedPhone,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: "ACTIVE",
        roles: { create: [{ roleId: role.id }] },
      },
      select: STAFF_SELECT,
    });
  }

  // Everyone with a real login and no customer link — staff, not a
  // customer's own account (customerId is only ever set for RETAILER
  // logins created via self-registration).
  list(tenantId: string, roleCode?: SystemRoleCode) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
        customerId: null,
        ...(roleCode ? { roles: { some: { role: { code: roleCode } } } } : {}),
      },
      select: STAFF_SELECT,
      orderBy: { firstName: "asc" },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null, customerId: null } });
    if (!user) {
      throw new BadRequestException("Staff account not found.");
    }
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), status: "SUSPENDED" } });
  }
}
