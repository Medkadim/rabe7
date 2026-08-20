import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { initializeApp, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { PrismaService } from "../../prisma/prisma.service";

// Every channel (Email, Firebase Push, WhatsApp) sits behind this one
// interface. Today it only logs — swapping in a real email/WhatsApp
// provider later means implementing this interface, not touching every
// module that sends a notification.
export interface NotificationMessage {
  to: string;
  subject: string;
  body: string;
}

export interface PushMessage {
  title: string;
  body: string;
  // Arbitrary key/value pairs delivered alongside the notification — e.g.
  // { type: "product", productId } so a tap can deep-link.
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: App | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const projectId = this.config.get<string>("FIREBASE_PROJECT_ID");
    const clientEmail = this.config.get<string>("FIREBASE_CLIENT_EMAIL");
    const privateKey = this.config.get<string>("FIREBASE_PRIVATE_KEY");

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn("Firebase credentials not set — push notifications will only be logged, not sent.");
      return;
    }

    this.firebaseApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // .env stores the key's newlines escaped as literal "\n" — real
        // newlines break most .env parsers/shells, so it's unescaped here.
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }

  async sendEmail(message: NotificationMessage): Promise<void> {
    // Phase 1 dev implementation: log instead of sending. Replace with a
    // real provider (e.g. SES, Postmark) by implementing this method —
    // nothing else in the codebase needs to change.
    this.logger.log(`[email → ${message.to}] ${message.subject}: ${message.body}`);
  }

  // Sends one push to every token given and reports back which ones are
  // dead (app uninstalled, registration expired) — Firebase only reveals
  // that on the next send attempt, never proactively, so the caller is
  // expected to delete those rows.
  async sendPush(tokens: string[], message: PushMessage): Promise<{ invalidTokens: string[] }> {
    if (tokens.length === 0) return { invalidTokens: [] };

    if (!this.firebaseApp) {
      this.logger.log(`[push → ${tokens.length} device(s)] ${message.title}: ${message.body}`);
      return { invalidTokens: [] };
    }

    const response = await getMessaging(this.firebaseApp).sendEachForMulticast({
      tokens,
      notification: { title: message.title, body: message.body },
      data: message.data,
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((result, index) => {
      const code = result.error?.code;
      if (!result.success && (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token")) {
        invalidTokens.push(tokens[index]);
      }
    });

    if (response.failureCount > 0) {
      this.logger.warn(`Push: ${response.failureCount}/${tokens.length} deliveries failed.`);
    }

    return { invalidTokens };
  }

  // Every registered device belonging to a customer login (i.e. has a
  // customerId — excludes staff/driver/sales accounts, which share the
  // same DeviceToken table but were never meant to get "new product"
  // alerts) in this tenant, then prunes whatever came back dead.
  private async broadcastToCustomers(tenantId: string, message: PushMessage): Promise<void> {
    const devices = await this.prisma.deviceToken.findMany({
      where: { tenantId, user: { customerId: { not: null } } },
      select: { token: true },
    });
    if (devices.length === 0) return;

    const { invalidTokens } = await this.sendPush(
      devices.map((d) => d.token),
      message,
    );
    if (invalidTokens.length > 0) {
      await this.prisma.deviceToken.deleteMany({ where: { token: { in: invalidTokens } } });
    }
  }

  async notifyNewProduct(tenantId: string, productId: string, productName: string): Promise<void> {
    await this.broadcastToCustomers(tenantId, {
      title: "منتج جديد على وصلة",
      body: productName,
      data: { type: "product", productId },
    });
  }

  async notifyNewPromotion(tenantId: string, promotionId: string, promotionName: string): Promise<void> {
    await this.broadcastToCustomers(tenantId, {
      title: "عرض جديد على وصلة",
      body: promotionName,
      data: { type: "promotion", promotionId },
    });
  }
}
