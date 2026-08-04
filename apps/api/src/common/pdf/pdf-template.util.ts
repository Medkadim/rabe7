// Shared shell for every generated PDF (delivery slip, loading manifest,
// recap) — one place for the brand header/styles so the three documents
// look like one family instead of three one-off layouts.

// Accepts a Prisma Decimal too (it stringifies cleanly via toString()) so
// callers don't need to convert order/line totals before formatting them.
export function formatDH(value: number | string | { toString(): string }): string {
  const amount = typeof value === "number" ? value : Number(value.toString());
  return `${amount.toFixed(2)} د.م.`;
}

export function formatArabicDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-MA", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

// The Waslak mark (see apps/storefront's wasla-mark.tsx) redrawn as a
// static SVG for the PDF header. Headless Chromium (used to render these
// PDFs) supports oklch() natively, so the brand colors here are the same
// OKLCH values as the web apps' --brand/--accent tokens, just inlined
// since a PDF has no CSS custom properties or dark mode to read from.
function waslaMarkSvg(size = 28): string {
  return `<svg width="${size}" height="${(size * 24) / 28}" viewBox="0 0 28 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M4,6 L9,18 L14,9 L19,18 L24,6" stroke="oklch(42% 0.085 175)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <circle cx="4" cy="6" r="2.6" fill="oklch(63% 0.15 34)" />
    <circle cx="24" cy="6" r="2.6" fill="oklch(63% 0.15 34)" />
  </svg>`;
}

export function pdfShell(options: { eyebrow: string; title: string; subtitle?: string; bodyHtml: string }): string {
  const { eyebrow, title, subtitle, bodyHtml } = options;
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: "Noto Naskh Arabic", "Noto Sans Arabic", "Noto Sans", Arial, sans-serif;
    direction: rtl;
    color: #14202e;
    margin: 0;
    padding: 0;
    font-size: 13px;
    line-height: 1.6;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid oklch(35% 0.08 175);
    padding-bottom: 12px;
    margin-bottom: 18px;
  }
  .brand { display: flex; align-items: center; gap: 8px; }
  .brand-name { font-size: 18px; font-weight: 700; color: oklch(35% 0.08 175); }
  .eyebrow { font-size: 11px; color: oklch(52% 0.14 34); font-weight: 600; }
  h1 { font-size: 18px; color: oklch(35% 0.08 175); margin: 2px 0; }
  .subtitle { color: #55606f; font-size: 12px; margin: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border-bottom: 1px solid #d8dee6; padding: 7px 8px; text-align: right; font-size: 12px; }
  th { background: #e7ecf3; color: #10233f; font-weight: 600; }
  tr:last-child td { border-bottom: none; }
  .muted { color: #55606f; }
  .totals-row td { border: none; padding-top: 4px; }
  .totals-row.grand td { font-size: 14px; font-weight: 700; color: oklch(35% 0.08 175); padding-top: 8px; }
  .section-title { font-size: 13px; font-weight: 700; color: oklch(35% 0.08 175); margin: 18px 0 6px; }
  .badge {
    display: inline-block;
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 600;
    background: #e7ecf3;
    color: #10233f;
  }
  .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #d8dee6; color: #55606f; font-size: 10px; }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      ${waslaMarkSvg(30)}
      <span class="brand-name">Waslak</span>
    </div>
    <div class="eyebrow">${eyebrow}</div>
  </div>
  <h1>${title}</h1>
  ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ""}
  ${bodyHtml}
  <div class="footer">تم إنشاء هذا المستند تلقائيًا بواسطة نظام Waslak.</div>
</body>
</html>`;
}
