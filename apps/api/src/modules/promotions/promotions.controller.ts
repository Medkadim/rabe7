import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PromotionsService } from "./promotions.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";
import { QueryPromotionsDto } from "./dto/query-promotions.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

@ApiTags("promotions")
@ApiBearerAuth()
@Controller({ path: "promotions", version: "1" })
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.PROMOTIONS_CREATE)
  @ApiOperation({ summary: "Create a promotion" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(user.tenantId, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PROMOTIONS_READ)
  @ApiOperation({ summary: "List promotions" })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryPromotionsDto) {
    return this.promotionsService.findAll(user.tenantId, query);
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.PROMOTIONS_READ)
  @ApiOperation({ summary: "Get a promotion" })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.promotionsService.findOne(user.tenantId, id);
  }

  @Patch(":id")
  @RequirePermissions(PERMISSIONS.PROMOTIONS_UPDATE)
  @ApiOperation({ summary: "Update a promotion" })
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(user.tenantId, id, dto);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.PROMOTIONS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Deactivate a promotion" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.promotionsService.deactivate(user.tenantId, id);
  }
}
