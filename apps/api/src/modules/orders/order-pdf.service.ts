import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PdfService } from "../../common/pdf/pdf.service";
import { formatDH, pdfShell } from "../../common/pdf/pdf-template.util";
import { OrdersService } from "./orders.service";

const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التجهيز",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغى",
};

@Injectable()
export class OrderPdfService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
    private readonly pdf: PdfService,
  ) {}

  async render(tenantId: string, orderId: string, callerCustomerId?: string | null): Promise<Buffer> {
    const order = await this.ordersService.findOne(tenantId, orderId, callerCustomerId);

    // Not part of OrdersService.findOne's include (that method is used on
    // every hot order-detail read) — fetched separately here since a
    // delivery slip is one of the few places that actually needs it.
    const address = await this.prisma.customerAddress.findFirst({
      where: { customerId: order.customerId },
      orderBy: { isDefault: "desc" },
    });

    const rows = order.items
      .map(
        (item) => `
      <tr>
        <td>${item.product.name}</td>
        <td>${item.quantity} ${item.product.unit}</td>
        <td>${formatDH(item.unitPrice)}</td>
        <td>${formatDH(item.lineTotal)}</td>
      </tr>`,
      )
      .join("");

    const bodyHtml = `
      <table>
        <thead>
          <tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>المجموع</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <table>
        <tr class="totals-row"><td class="muted">المجموع الفرعي</td><td>${formatDH(order.subtotal)}</td></tr>
        <tr class="totals-row"><td class="muted">الخصم</td><td>-${formatDH(order.discountTotal)}</td></tr>
        <tr class="totals-row"><td class="muted">الضريبة</td><td>${formatDH(order.taxTotal)}</td></tr>
        <tr class="totals-row grand"><td>المجموع الكلي</td><td>${formatDH(order.total)}</td></tr>
      </table>
      <div class="section-title">معلومات العميل</div>
      <p>
        ${order.customer.name}<br/>
        ${order.customer.phone ? `${order.customer.phone}<br/>` : ""}
        ${address ? `${address.line1}${address.line2 ? `، ${address.line2}` : ""}<br/>${address.city}${address.region ? `، ${address.region}` : ""}، ${address.country}` : ""}
      </p>
    `;

    const html = pdfShell({
      eyebrow: `<span class="badge">${ORDER_STATUS_LABELS[order.status] ?? order.status}</span>`,
      title: `بون التوصيل — طلب رقم ${order.orderNumber}`,
      subtitle: order.placedAt ? `تاريخ الطلب: ${order.placedAt.toLocaleDateString("ar-MA")}` : undefined,
      bodyHtml,
    });

    return this.pdf.renderHtmlToPdf(html);
  }
}
