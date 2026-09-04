import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { QueryPaymentsDto } from "./dto/query-payments.dto";
import { paginate, PaginatedResult } from "../../common/dto/pagination-query.dto";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreatePaymentDto) {
    let invoice = null;
    if (dto.invoiceId) {
      invoice = await this.prisma.invoice.findFirst({
        where: { id: dto.invoiceId, tenantId, customerId: dto.customerId },
      });
      if (!invoice) {
        throw new NotFoundException("Invoice not found for this customer.");
      }
      if (invoice.status === "VOID") {
        throw new BadRequestException("Cannot pay a voided invoice.");
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          customerId: dto.customerId,
          invoiceId: dto.invoiceId,
          method: dto.method,
          amount: dto.amount,
          reference: dto.reference,
          notes: dto.notes,
          receivedByUserId: userId,
        },
      });

      if (invoice) {
        const amountPaid = Number(invoice.amountPaid) + dto.amount;
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid,
            status: amountPaid >= Number(invoice.totalAmount) ? "PAID" : "PARTIALLY_PAID",
          },
        });
      }

      return payment;
    });
  }

  // callerCustomerId is set only for a customer's own login (RETAILER role)
  // — see OrdersService for the same pattern. Without it, granting them
  // PAYMENTS_READ at all would let them list every customer's payments.
  async findAll(
    tenantId: string,
    query: QueryPaymentsDto,
    callerCustomerId?: string | null,
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.PaymentWhereInput = { tenantId, customerId: callerCustomerId ?? query.customerId };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { receivedAt: query.sortDirection },
        include: { customer: true, invoice: true },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  async findOne(tenantId: string, id: string, callerCustomerId?: string | null) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId },
      include: { customer: true, invoice: true, order: true },
    });
    if (!payment || (callerCustomerId && payment.customerId !== callerCustomerId)) {
      throw new NotFoundException("Payment not found.");
    }
    return payment;
  }
}
