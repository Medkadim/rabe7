import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { OrdersService } from "./orders.service";

@Injectable()
export class OrderPdfService {
  constructor(private readonly ordersService: OrdersService) {}

  async render(tenantId: string, orderId: string, callerCustomerId?: string | null): Promise<Buffer> {
    const order = await this.ordersService.findOne(tenantId, orderId, callerCustomerId);

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(20).text(`Order ${order.orderNumber}`, { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#555").text(`Status: ${order.status}`);
    doc.text(`Placed: ${order.placedAt?.toDateString() ?? "-"}`);
    doc.moveDown();

    doc.fillColor("#000").fontSize(12).text("Bill to");
    doc.fontSize(10).text(order.customer.name);
    if (order.customer.phone) doc.text(order.customer.phone);
    doc.moveDown();

    const tableTop = doc.y;
    doc.fontSize(10).text("Product", 50, tableTop);
    doc.text("Qty", 300, tableTop);
    doc.text("Unit price", 360, tableTop);
    doc.text("Line total", 460, tableTop);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    for (const item of order.items) {
      const rowY = doc.y + 6;
      doc.text(item.product.name, 50, rowY, { width: 240 });
      doc.text(String(item.quantity), 300, rowY);
      doc.text(Number(item.unitPrice).toFixed(2), 360, rowY);
      doc.text(Number(item.lineTotal).toFixed(2), 460, rowY);
      doc.moveDown();
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.text(`Subtotal: ${Number(order.subtotal).toFixed(2)}`, { align: "right" });
    doc.text(`Discount: -${Number(order.discountTotal).toFixed(2)}`, { align: "right" });
    doc.text(`Tax: ${Number(order.taxTotal).toFixed(2)}`, { align: "right" });
    doc.fontSize(12).text(`Total: ${Number(order.total).toFixed(2)}`, { align: "right" });

    doc.end();

    return new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}
