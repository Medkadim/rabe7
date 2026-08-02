import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { SequenceService } from "../../common/sequence/sequence.service";
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

    const existing = await this.prisma.customer.findFirst({
      where: { tenantId, code },
    });
    if (existing) {
      throw new ConflictException(`A customer with code "${code}" already exists.`);
    }

    return this.prisma.customer.create({
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
    await this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
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
