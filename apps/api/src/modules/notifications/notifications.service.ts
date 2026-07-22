import { Injectable, Logger } from "@nestjs/common";

// Every channel (Email, Firebase Push, WhatsApp) sits behind this one
// interface. Today it only logs — swapping in a real email/WhatsApp
// provider later means implementing this interface, not touching every
// module that sends a notification.
export interface NotificationMessage {
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendEmail(message: NotificationMessage): Promise<void> {
    // Phase 1 dev implementation: log instead of sending. Replace with a
    // real provider (e.g. SES, Postmark) by implementing this method —
    // nothing else in the codebase needs to change.
    this.logger.log(`[email → ${message.to}] ${message.subject}: ${message.body}`);
  }
}
