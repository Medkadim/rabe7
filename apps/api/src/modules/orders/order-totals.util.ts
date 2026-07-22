export interface PricedLine {
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRatePercent: number;
}

export interface ComputedLine extends PricedLine {
  taxAmount: number;
  lineTotal: number;
}

// What order totals actually need — deliberately excludes taxRatePercent
// (an input to the per-line calculation, not something totals re-derive)
// so callers can pass persisted OrderItem rows straight in.
export type TotalableLine = Pick<ComputedLine, "quantity" | "unitPrice" | "discountAmount" | "taxAmount" | "lineTotal">;

export interface OrderTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
}

// Rounding to 2 decimals happens once, at the end of each line — never on
// intermediate values — so totals always foot correctly against the sum of
// their lines, the way an accountant expects an invoice to reconcile.
export function computeLine(line: PricedLine): ComputedLine {
  const gross = line.quantity * line.unitPrice - line.discountAmount;
  const taxAmount = round2(gross * (line.taxRatePercent / 100));
  const lineTotal = round2(gross + taxAmount);
  return { ...line, taxAmount, lineTotal };
}

export function computeOrderTotals(lines: TotalableLine[]): OrderTotals {
  const subtotal = round2(lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0));
  const discountTotal = round2(lines.reduce((sum, l) => sum + l.discountAmount, 0));
  const taxTotal = round2(lines.reduce((sum, l) => sum + l.taxAmount, 0));
  const total = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  return { subtotal, discountTotal, taxTotal, total };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
