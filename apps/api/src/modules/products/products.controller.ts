import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { QueryProductsDto } from "./dto/query-products.dto";
import { CreateProductPriceDto, CreateCustomerPriceDto } from "./dto/product-price.dto";
import { CreateCategoryDto, CreateBrandDto } from "./dto/category-brand.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

@ApiTags("products")
@ApiBearerAuth()
@Controller({ path: "products", version: "1" })
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post("categories")
  @RequirePermissions(PERMISSIONS.PRODUCTS_CREATE)
  @ApiOperation({ summary: "Create a product category" })
  createCategory(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCategoryDto) {
    return this.productsService.createCategory(user.tenantId, dto);
  }

  @Get("categories")
  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: "List product categories" })
  listCategories(@CurrentUser() user: AuthenticatedUser) {
    return this.productsService.listCategories(user.tenantId);
  }

  @Post("brands")
  @RequirePermissions(PERMISSIONS.PRODUCTS_CREATE)
  @ApiOperation({ summary: "Create a brand" })
  createBrand(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBrandDto) {
    return this.productsService.createBrand(user.tenantId, dto);
  }

  @Get("brands")
  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: "List brands" })
  listBrands(@CurrentUser() user: AuthenticatedUser) {
    return this.productsService.listBrands(user.tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PRODUCTS_CREATE)
  @ApiOperation({ summary: "Create a product" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.tenantId, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: "List products with search, filtering and pagination" })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryProductsDto) {
    return this.productsService.findAll(user.tenantId, query);
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: "Get a product by id" })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.productsService.findOne(user.tenantId, id);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: "Update a product" })
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(user.tenantId, id, dto);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.PRODUCTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Archive a product (soft delete)" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.productsService.remove(user.tenantId, id);
  }

  @Post(":id/prices")
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: "Add a volume price tier to a product" })
  addPriceTier(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateProductPriceDto,
  ) {
    return this.productsService.addPriceTier(user.tenantId, id, dto);
  }

  @Post(":id/customer-prices")
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: "Set a special price for one customer" })
  setCustomerPrice(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateCustomerPriceDto,
  ) {
    return this.productsService.setCustomerPrice(user.tenantId, id, dto);
  }
}
