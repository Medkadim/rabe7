import { Body, Controller, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { DeliveryService } from "./delivery.service";
import { DeliveryPdfService } from "./delivery-pdf.service";
import { CreateRouteDto } from "./dto/create-route.dto";
import { AssignOrderDto } from "./dto/assign-order.dto";
import { UpdateDeliveryStatusDto } from "./dto/update-delivery-status.dto";
import { QueryRoutesDto } from "./dto/query-routes.dto";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

@ApiTags("delivery")
@ApiBearerAuth()
@Controller({ path: "delivery", version: "1" })
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly deliveryPdfService: DeliveryPdfService,
  ) {}

  @Post("routes")
  @RequirePermissions(PERMISSIONS.DELIVERY_ROUTES_MANAGE)
  @ApiOperation({ summary: "Create a delivery route" })
  createRoute(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRouteDto) {
    return this.deliveryService.createRoute(user.tenantId, dto);
  }

  @Get("routes")
  @RequirePermissions(PERMISSIONS.DELIVERY_READ)
  @ApiOperation({ summary: "List delivery routes" })
  listRoutes(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryRoutesDto) {
    return this.deliveryService.listRoutes(user.tenantId, query);
  }

  @Get("my-routes")
  @RequirePermissions(PERMISSIONS.DELIVERY_READ)
  @ApiOperation({ summary: "List the current driver's own routes and stops" })
  listMyRoutes(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.listMyRoutes(user.tenantId, user.userId);
  }

  @Get("routes/:id")
  @RequirePermissions(PERMISSIONS.DELIVERY_READ)
  @ApiOperation({ summary: "Get a route and its stops" })
  findRoute(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.deliveryService.findRoute(user.tenantId, id);
  }

  @Post("routes/:id/orders")
  @RequirePermissions(PERMISSIONS.DELIVERY_ROUTES_MANAGE)
  @ApiOperation({ summary: "Assign an order to a route as a delivery stop" })
  assignOrder(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: AssignOrderDto) {
    return this.deliveryService.assignOrder(user.tenantId, id, dto);
  }

  @Get("routes/:id/loading-slip")
  @RequirePermissions(PERMISSIONS.DELIVERY_ROUTES_MANAGE)
  @ApiOperation({ summary: "Download the loading slip (bon de chargement) for one route/driver as a PDF" })
  async downloadRouteLoadingSlip(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const pdf = await this.deliveryPdfService.renderRouteLoadingSlip(user.tenantId, id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="loading-slip-${id}.pdf"`);
    res.send(pdf);
  }

  @Get("loading-slip")
  @RequirePermissions(PERMISSIONS.DELIVERY_ROUTES_MANAGE)
  @ApiOperation({ summary: "Download the global loading recap for a day, across every route/driver, as a PDF" })
  async downloadGlobalRecap(
    @CurrentUser() user: AuthenticatedUser,
    @Query("date") date: string | undefined,
    @Res() res: Response,
  ) {
    const target = date ? new Date(date) : new Date();
    const pdf = await this.deliveryPdfService.renderGlobalRecap(user.tenantId, target);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="loading-recap.pdf"`);
    res.send(pdf);
  }

  @Get("deliveries")
  @RequirePermissions(PERMISSIONS.DELIVERY_READ)
  @ApiOperation({ summary: "List deliveries, optionally filtered by route" })
  listDeliveries(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
    @Query("routeId") routeId?: string,
  ) {
    return this.deliveryService.listDeliveries(user.tenantId, query, routeId);
  }

  @Get("deliveries/:id")
  @RequirePermissions(PERMISSIONS.DELIVERY_READ)
  @ApiOperation({ summary: "Get a delivery" })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.deliveryService.findOne(user.tenantId, id);
  }

  @Patch("deliveries/:id/status")
  @RequirePermissions(PERMISSIONS.DELIVERY_UPDATE_STATUS)
  @ApiOperation({ summary: "Update a delivery's status (out for delivery, delivered, partial, failed)" })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateStatus(user.tenantId, user.userId, id, dto);
  }
}
