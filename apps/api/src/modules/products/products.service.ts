import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { QueryProductsDto } from "./dto/query-products.dto";
import { CreateProductPriceDto, CreateCustomerPriceDto } from "./dto/product-price.dto";
import { CreateCategoryDto, CreateBrandDto } from "./dto/category-brand.dto";
import { paginate, PaginatedResult } from "../../common/dto/pagination-query.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Categories ----------------------------------------------------

  createCategory(tenantId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: { tenantId, name: dto.name, parentId: dto.parentId } });
  }

  listCategories(tenantId: string) {
    return this.prisma.category.findMany({ where: { tenantId, isActive: true }, orderBy: { name: "asc" } });
  }

  // ---- Brands ----------------------------------------------------------

  createBrand(tenantId: string, dto: CreateBrandDto) {
    return this.prisma.brand.create({ data: { tenantId, name: dto.name } });
  }

  listBrands(tenantId: string) {
    return this.prisma.brand.findMany({ where: { tenantId, isActive: true }, orderBy: { name: "asc" } });
  }

  // ---- Products ----------------------------------------------------------

  async create(tenantId: string, dto: CreateProductDto) {
    const existing = await this.prisma.product.findFirst({ where: { tenantId, sku: dto.sku } });
    if (existing) {
      throw new ConflictException(`A product with SKU "${dto.sku}" already exists.`);
    }
    return this.prisma.product.create({ data: { tenantId, ...dto } });
  }

  async findAll(tenantId: string, query: QueryProductsDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ProductWhereInput = {
      tenantId,
      deletedAt: null,
      status: query.status,
      categoryId: query.categoryId,
      brandId: query.brandId,
      isFeatured: query.featured === undefined ? undefined : query.featured === "true",
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { sku: { contains: query.search, mode: "insensitive" } },
              { barcode: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: query.sortDirection },
        include: { category: true, brand: true, prices: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(data, total, query);
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { category: true, brand: true, prices: true, customerPrices: true },
    });
    if (!product) {
      throw new NotFoundException("Product not found.");
    }
    return product;
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(tenantId, id);
    return this.prisma.product.update({ where: { id }, data: { ...dto } });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addPriceTier(tenantId: string, productId: string, dto: CreateProductPriceDto) {
    await this.findOne(tenantId, productId);
    return this.prisma.productPrice.create({
      data: {
        tenantId,
        productId,
        name: dto.name,
        minQuantity: dto.minQuantity ?? 1,
        price: dto.price,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
    });
  }

  async setCustomerPrice(tenantId: string, productId: string, dto: CreateCustomerPriceDto) {
    await this.findOne(tenantId, productId);
    return this.prisma.customerPrice.upsert({
      where: { tenantId_customerId_productId: { tenantId, customerId: dto.customerId, productId } },
      create: {
        tenantId,
        productId,
        customerId: dto.customerId,
        price: dto.price,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      update: {
        price: dto.price,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
    });
  }

  // The single source of truth for "what does this customer pay for this
  // product, right now, at this quantity". Priority: a price negotiated
  // for this specific customer beats a volume tier, which beats the
  // catalog base price. Used by the Orders module when building line items.
  async resolvePrice(
    tenantId: string,
    productId: string,
    customerId: string,
    quantity: number,
  ): Promise<number> {
    const now = new Date();

    const customerPrice = await this.prisma.customerPrice.findFirst({
      where: {
        tenantId,
        productId,
        customerId,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
    });
    if (customerPrice) return Number(customerPrice.price);

    const tier = await this.prisma.productPrice.findFirst({
      where: {
        tenantId,
        productId,
        minQuantity: { lte: quantity },
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { minQuantity: "desc" },
    });
    if (tier) return Number(tier.price);

    const product = await this.findOne(tenantId, productId);
    return Number(product.basePrice);
  }
}
