import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { validateEnv } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { SequenceModule } from "./common/sequence/sequence.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthController } from "./modules/health/health.controller";
import { CustomersModule } from "./modules/customers/customers.module";
import { ProductsModule } from "./modules/products/products.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { PromotionsModule } from "./modules/promotions/promotions.module";
import { WarehouseModule } from "./modules/warehouse/warehouse.module";
import { DeliveryModule } from "./modules/delivery/delivery.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { FavoritesModule } from "./modules/favorites/favorites.module";
import { StaffModule } from "./modules/staff/staff.module";
import { SalesModule } from "./modules/sales/sales.module";
import { StatsModule } from "./modules/stats/stats.module";
import { SettingsModule } from "./modules/settings/settings.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    SequenceModule,
    NotificationsModule,
    AuthModule,
    CustomersModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    PromotionsModule,
    WarehouseModule,
    DeliveryModule,
    UploadsModule,
    FavoritesModule,
    StaffModule,
    SalesModule,
    StatsModule,
    SettingsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
