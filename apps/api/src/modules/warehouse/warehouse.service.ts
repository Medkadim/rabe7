import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { OrdersService } from "../orders/orders.service";
import { ReceiveStockDto } from "./dto/receive-stock.dto";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { CreateReturnDto } from "./dto/create-return.dto";
import { QueryMovementsDto } from "./dto/query-movements.dto";
import { PaginationQueryDto, paginate, PaginatedResult } from "../../common/dto/pagination-query.dto";

@Injectable()
export class WarehouseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  async receiveStock(tenantId: string, userId: string, dto: ReceiveStockDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: dto.productId, tenantId } });
      if (!product) throw new NotFoundException("Product not found.");

      await tx.product.update({
        where: { id: dto.productId },
        data: { currentStock: { increment: dto.quantity } },
      });

      return tx.stockMovement.create({
        data: {
          tenantId,
          productId: dto.productId,
          type: "RECEIVING",
          quantity: dto.quantity,
          referenceType: "MANUAL",
          note: dto.note,
          performedByUserId: userId,
        },
      });
    });
  }

  async adjustStock(tenantId: string, userId: string, dto: AdjustStockDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: dto.productId, tenantId } });
      if (!product) throw new NotFoundException("Product not found.");
      if (product.currentStock + dto.quantity < 0) {
        throw new BadRequestException("This adjustment would take stock below zero.");
      }

      await tx.product.update({
        where: { id: dto.productId },
        data: { currentStock: { increment: dto.quantity } },
      });

      return tx.stockMovement.create({
        data: {
          tenantId,
          productId: dto.productId,
          type: "ADJUSTMENT",
          quantity: dto.quantity,
          referenceType: "MANUAL",
          note: dto.note,
          performedByUserId: userId,
        },
      });
    });
  }

  // Picking is what turns a confirmed order into a physically-fulfilled
  // one: it's the moment stock actually leaves the shelf, so it's also
  // where an out-of-stock situation is finally, unavoidably discovered.
  async pickOrder(tenantId: string, userId: string, orderId: string) {
    const order = await this.orders.findOne(tenantId, orderId);
    if (order.status !== "CONFIRMED") {
      throw new BadRequestException(`Only a confirmed order can be picked (this one is ${order.status}).`);
    }

    const shortages: string[] = [];
    for (const item of order.items) {
      if (item.product.currentStock < item.quantity) {
        shortages.push(`${item.product.name} (need ${item.quantity}, have ${item.product.currentStock})`);
      }
    }
    if (shortages.length > 0) {
      throw new BadRequestException(`Not enough stock to pick this order: ${shortages.join(", ")}`);
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            type: "PICKED",
            quantity: -item.quantity,
            referenceType: "ORDER",
            referenceId: orderId,
            performedByUserId: userId,
          },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: "PROCESSING",
          statusHistory: {
            create: { fromStatus: "CONFIRMED", toStatus: "PROCESSING", changedByUserId: userId, note: "Picked" },
          },
        },
      });
    });
  }

  async listMovements(tenantId: string, query: QueryMovementsDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.StockMovementWhereInput = { tenantId, productId: query.productId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: query.sortDirection },
        include: { product: true, performedByUser: true },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async lowStock(tenantId: string) {
    return this.prisma.$queryRaw`
      SELECT * FROM products
      WHERE "tenantId" = ${tenantId}
        AND "deletedAt" IS NULL
        AND status = 'ACTIVE'
        AND "currentStock" <= "minStock"
      ORDER BY "currentStock" ASC
    `;
  }

  // ---- Returns ----------------------------------------------------------

  async createReturn(tenantId: string, userId: string, dto: CreateReturnDto) {
    return this.prisma.return.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        orderId: dto.orderId,
        reason: dto.reason,
        createdByUserId: userId,
        items: { create: dto.items.map((item) => ({ ...item })) },
      },
      include: { items: { include: { product: true } }, customer: true },
    });
  }

  async listReturns(tenantId: string, query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ReturnWhereInput = { tenantId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.return.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: query.sortDirection },
        include: { items: { include: { product: true } }, customer: true },
      }),
      this.prisma.return.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  // Receiving a return is the only moment stock changes: logging the
  // return doesn't touch inventory, because the goods haven't physically
  // come back yet. Only SELLABLE items go back on the shelf — damaged
  // stock is written off, not silently re-added to what you can sell.
  async receiveReturn(tenantId: string, userId: string, returnId: string, status: "RECEIVED" | "REJECTED") {
    const existingReturn = await this.prisma.return.findFirst({
      where: { id: returnId, tenantId },
      include: { items: true },
    });
    if (!existingReturn) throw new NotFoundException("Return not found.");
    if (existingReturn.status !== "PENDING") {
      throw new BadRequestException(`This return has already been ${existingReturn.status.toLowerCase()}.`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (status === "RECEIVED") {
        for (const item of existingReturn.items) {
          if (item.condition !== "SELLABLE") continue;
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              type: "RETURNED",
              quantity: item.quantity,
              referenceType: "RETURN",
              referenceId: returnId,
              performedByUserId: userId,
            },
          });
        }
      }

      return tx.return.update({ where: { id: returnId }, data: { status } });
    });
  }
}
