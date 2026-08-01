import { Module } from "@nestjs/common";
import { DeliveryService } from "./delivery.service";
import { DeliveryPdfService } from "./delivery-pdf.service";
import { DeliveryController } from "./delivery.controller";
import { OrdersModule } from "../orders/orders.module";
import { PaymentsModule } from "../payments/payments.module";
import { PdfModule } from "../../common/pdf/pdf.module";

@Module({
  imports: [OrdersModule, PaymentsModule, PdfModule],
  controllers: [DeliveryController],
  providers: [DeliveryService, DeliveryPdfService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
