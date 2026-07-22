import { computeLine, computeOrderTotals } from "./order-totals.util";

describe("order totals", () => {
  it("computes tax on the discounted amount, not the gross amount", () => {
    const line = computeLine({ quantity: 10, unitPrice: 5, discountAmount: 5, taxRatePercent: 20 });

    // gross = 10*5 - 5 = 45; tax = 45*0.20 = 9; total = 54
    expect(line.taxAmount).toBe(9);
    expect(line.lineTotal).toBe(54);
  });

  it("rounds each line to 2 decimals independently", () => {
    const line = computeLine({ quantity: 3, unitPrice: 3.333, discountAmount: 0, taxRatePercent: 10 });
    // gross = 9.999, tax = 0.9999 -> 1.00, total = 9.999 + 1.00 = 11.00 (rounded)
    expect(line.taxAmount).toBe(1);
    expect(line.lineTotal).toBe(11);
  });

  it("sums a multi-line order so totals foot correctly", () => {
    const lines = [
      computeLine({ quantity: 2, unitPrice: 10, discountAmount: 0, taxRatePercent: 0 }),
      computeLine({ quantity: 1, unitPrice: 50, discountAmount: 5, taxRatePercent: 20 }),
    ];

    const totals = computeOrderTotals(lines);

    expect(totals.subtotal).toBe(70); // 2*10 + 1*50
    expect(totals.discountTotal).toBe(5);
    expect(totals.taxTotal).toBe(9); // (50-5)*0.20
    expect(totals.total).toBe(74); // 20 + 54
  });
});
