import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SystemRoleCode } from "@prisma/client";
import * as argon2 from "argon2";
import { PrismaService } from "../../prisma/prisma.service";
import { SequenceService } from "../../common/sequence/sequence.service";
import { normalizePhone } from "../auth/utils/phone.util";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { QueryCustomersDto } from "./dto/query-customers.dto";
import { paginate, PaginatedResult } from "../../common/dto/pagination-query.dto";

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: SequenceService,
  ) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    // A rep recruiting a customer in the field shouldn't have to invent a
    // unique code on the spot — generate one the same way order numbers are
    // when the caller (sales app) doesn't supply one. The admin's own
    // customer form still passes a manually-chosen code.
    const code = dto.code ?? this.sequence.formatNumber("CUST", await this.sequence.next(tenantId, "customer"));

    // deletedAt: null — a code freed up by archiving a customer (see
    // remove()) must be reusable, not permanently burned.
    const existing = await this.prisma.customer.findFirst({
      where: { tenantId, code, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(`A customer with code "${code}" already exists.`);
    }

    // Optional: whoever's creating this customer (typically a sales rep,
    // per CreateCustomerDto's comment) can set up a login right away
    // instead of leaving the customer with no way to sign in. Validated
    // up front, outside the transaction, so a bad phone/duplicate account
    // fails before the customer row is ever written.
    let normalizedPhone: string | null = null;
    if (dto.password) {
      if (!dto.phone) {
        throw new BadRequestException("A phone number is required to set a temporary password.");
      }
      normalizedPhone = normalizePhone(dto.phone);
      if (!normalizedPhone) {
        throw new BadRequestException("Enter a valid Moroccan phone number (e.g. 0612345678).");
      }
      await this.assertPhoneIsFree(tenantId, normalizedPhone);
    }

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          tenantId,
          code,
          name: dto.name,
          legalName: dto.legalName,
          taxId: dto.taxId,
          phone: dto.phone,
          email: dto.email,
          segment: dto.segment,
          creditLimit: dto.creditLimit ?? 0,
          paymentTermsDays: dto.paymentTermsDays ?? 0,
          assignedRepId: dto.assignedRepId,
          notes: dto.notes,
          photoUrl: dto.photoUrl,
          addresses: dto.addresses
            ? { create: dto.addresses.map((address) => ({ ...address })) }
            : undefined,
        },
        include: { addresses: true },
      });

      if (dto.password && normalizedPhone) {
        await this.upsertCustomerLogin(tx, tenantId, customer, normalizedPhone, dto.password);
      }

      return customer;
    });
  }

  // Sets (or resets) the password a customer logs into the storefront
  // with — used both by create() above (a brand-new login) and by staff
  // resetting a forgotten one for an existing customer (see
  // CustomersController#resetPassword). Creates the linked User account
  // if this customer never had one yet, rather than requiring it to
  // already exist.
  async resetPassword(tenantId: string, id: string, phone: string, password: string): Promise<void> {
    const customer = await this.findOne(tenantId, id);
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new BadRequestException("Enter a valid Moroccan phone number (e.g. 0612345678).");
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId, customerId: id, deletedAt: null },
    });
    // Only reject a phone collision with *someone else's* account —
    // this customer keeping (or changing to) their own number is fine.
    if (!existingUser || existingUser.phone !== normalizedPhone) {
      await this.assertPhoneIsFree(tenantId, normalizedPhone);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({ where: { id }, data: { phone: normalizedPhone } });
      await this.upsertCustomerLogin(tx, tenantId, customer, normalizedPhone, password);
    });
  }

  private async assertPhoneIsFree(tenantId: string, normalizedPhone: string): Promise<void> {
    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId, deletedAt: null, phone: normalizedPhone },
    });
    if (existingUser) {
      throw new ConflictException("An account with this phone number already exists.");
    }
  }

  private async upsertCustomerLogin(
    tx: Prisma.TransactionClient,
    tenantId: string,
    customer: { id: string; name: string },
    normalizedPhone: string,
    password: string,
  ): Promise<void> {
    const passwordHash = await argon2.hash(password);
    const existingUser = await tx.user.findFirst({
      where: { tenantId, customerId: customer.id, deletedAt: null },
    });

    if (existingUser) {
      await tx.user.update({
        where: { id: existingUser.id },
        data: { phone: normalizedPhone, passwordHash, status: "ACTIVE" },
      });
      return;
    }

    const retailerRole = await tx.role.findFirstOrThrow({
      where: { tenantId, code: SystemRoleCode.RETAILER },
    });
    const user = await tx.user.create({
      data: {
        tenantId,
        customerId: customer.id,
        phone: normalizedPhone,
        passwordHash,
        firstName: customer.name,
        lastName: "",
        status: "ACTIVE",
      },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: retailerRole.id } });
  }

  async findAll(tenantId: string, query: QueryCustomersDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
      status: query.status,
      segment: query.segment,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { code: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: query.sortDirection },
        include: { addresses: true },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { addresses: true, customerPrices: true },
    });
    if (!customer) {
      throw new NotFoundException("Customer not found.");
    }
    return customer;
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(tenantId, id);
    return this.prisma.customer.update({
      where: { id },
      data: { ...dto },
      include: { addresses: true },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.$transaction([
      this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } }),
      // Otherwise this customer's phone number stays permanently claimed
      // by a zombie login no one can sign into or see — a new customer
      // created later with the same number would fail as "already
      // registered" even though this one is gone.
      this.prisma.user.updateMany({
        where: { tenantId, customerId: id, deletedAt: null },
        data: { deletedAt: new Date(), status: "SUSPENDED" },
      }),
    ]);
  }

  // Used by the Orders module to enforce (or warn about) the credit policy
  // before an order is confirmed.
  async getOutstandingBalance(tenantId: string, customerId: string): Promise<number> {
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId, customerId, status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
    });
    return invoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount) - Number(invoice.amountPaid),
      0,
    );
  }

  async assertWithinCreditLimit(tenantId: string, customerId: string, additionalAmount: number): Promise<void> {
    const customer = await this.findOne(tenantId, customerId);
    if (Number(customer.creditLimit) <= 0) return; // no limit configured
    const outstanding = await this.getOutstandingBalance(tenantId, customerId);
    if (outstanding + additionalAmount > Number(customer.creditLimit)) {
      throw new ForbiddenException(
        `This order would put ${customer.name} over their credit limit of ${customer.creditLimit}.`,
      );
    }
  }
}
