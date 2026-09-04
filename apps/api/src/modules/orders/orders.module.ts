import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { OrderPdfService } from "./order-pdf.service";
import { ProductsModule } from "../products/products.module";
import { CustomersModule } from "../customers/customers.module";
import { PromotionsModule } from "../promotions/promotions.module";
import { PdfModule } from "../../common/pdf/pdf.module";

@Module({
  imports: [ProductsModule, CustomersModule, PromotionsModule, PdfModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderPdfService],
  exports: [OrdersService],
})
export class OrdersModule {}
