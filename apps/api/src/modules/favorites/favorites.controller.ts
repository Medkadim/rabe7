import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FavoritesService } from "./favorites.service";
import { AddFavoriteDto } from "./dto/add-favorite.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

@ApiTags("favorites")
@ApiBearerAuth()
@Controller({ path: "favorites", version: "1" })
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.FAVORITES_MANAGE)
  @ApiOperation({ summary: "List the signed-in customer's favorite products" })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.list(user.tenantId, user.customerId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.FAVORITES_MANAGE)
  @ApiOperation({ summary: "Save a product to favorites" })
  add(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddFavoriteDto) {
    return this.favoritesService.add(user.tenantId, user.customerId, dto.productId);
  }

  @Delete(":productId")
  @RequirePermissions(PERMISSIONS.FAVORITES_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a product from favorites" })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("productId") productId: string): Promise<void> {
    await this.favoritesService.remove(user.tenantId, user.customerId, productId);
  }
}
