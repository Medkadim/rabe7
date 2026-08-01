import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { chromium, type Browser } from "playwright";

// Every generated document (delivery slip, loading manifest, recap) is an
// HTML string rendered to PDF through a real browser engine rather than a
// PDF-drawing library — pdfkit and similar tools don't do Arabic text
// shaping (letters render disconnected, in the wrong order), while a
// browser's own font/text layout handles RTL and Arabic correctly for free.
@Injectable()
export class PdfService implements OnModuleDestroy {
  private browserPromise: Promise<Browser> | null = null;

  // One Chromium instance is launched lazily and reused across every PDF
  // request for the life of the process — starting a fresh browser per
  // request would add a very real ~1s+ delay to every single download.
  private getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = chromium.launch({ args: ["--no-sandbox"] });
    }
    return this.browserPromise;
  }

  async renderHtmlToPdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "networkidle" });
      return await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
      });
    } finally {
      await page.close();
    }
  }

  async onModuleDestroy() {
    if (this.browserPromise) {
      const browser = await this.browserPromise;
      await browser.close();
    }
  }
}
