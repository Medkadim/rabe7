import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { QueryCustomersDto } from "./dto/query-customers.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

@ApiTags("customers")
@ApiBearerAuth()
@Controller({ path: "customers", version: "1" })
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.CUSTOMERS_CREATE)
  @ApiOperation({ summary: "Create a customer" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.tenantId, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.CUSTOMERS_READ)
  @ApiOperation({ summary: "List customers with search, filtering and pagination" })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryCustomersDto) {
    return this.customersService.findAll(user.tenantId, query);
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.CUSTOMERS_READ)
  @ApiOperation({ summary: "Get a customer by id" })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.customersService.findOne(user.tenantId, id);
  }

  @Get(":id/outstanding-balance")
  @RequirePermissions(PERMISSIONS.CUSTOMERS_READ)
  @ApiOperation({ summary: "Get a customer's total unpaid balance" })
  async getOutstandingBalance(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    const outstandingBalance = await this.customersService.getOutstandingBalance(user.tenantId, id);
    return { outstandingBalance };
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.CUSTOMERS_UPDATE)
  @ApiOperation({ summary: "Update a customer" })
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(user.tenantId, id, dto);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.CUSTOMERS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Archive a customer (soft delete)" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.customersService.remove(user.tenantId, id);
  }
}
