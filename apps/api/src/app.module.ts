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
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
