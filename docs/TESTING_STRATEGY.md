# Testing Strategy

## The short version

Three layers, each catching a different kind of mistake:

1. **Unit tests** (automated, run in seconds) — verify business rules in isolation: "does a
   customer over their credit limit get blocked", "does tax get calculated on the discounted
   amount, not the full price". These run on every code change.
2. **Manual end-to-end verification** (done during development, documented below) — proves
   the whole system works together against a real database and a real browser, not mocks.
3. **Automated end-to-end tests** (Phase 2) — the manual checks below get turned into
   Playwright scripts that run automatically instead of by hand, so a future change can't
   silently break the login flow or the order-creation flow without someone noticing.

## Layer 1: Unit tests — what's covered today

18 tests, all passing, covering the business logic that would cost real money to get wrong:

| Area | What's verified |
|---|---|
| Customers | Duplicate customer codes are rejected; a tenant can never see another tenant's customer; the credit-limit check correctly blocks/allows based on outstanding invoices |
| Products | Price resolution priority — a customer-specific price always wins over a volume tier, which always wins over the catalog base price |
| Orders | Tax is computed on the discounted line amount, not the gross amount; multi-line order totals foot correctly; a confirmed order can't be edited; a delivered order can't be cancelled |
| Payments | A partial payment marks an invoice `PARTIALLY_PAID`; a payment that covers the full balance marks it `PAID` |

Run them:

```bash
pnpm --filter @rabe7/api test
```

New business logic should come with a test in the same pull request — not as a follow-up.

## Layer 2: Manual end-to-end verification (done during Phase 1 build)

This is the actual sequence that was run against a live PostgreSQL database and a live
browser to prove Phase 1 works, not just compiles:

1. **Auth**: seeded Super Admin logs in → receives a JWT access token + roles + permissions
2. **RBAC**: an unauthenticated request to a protected endpoint is correctly rejected (401);
   an authenticated request without the right permission is correctly rejected (403)
3. **Customers**: create a customer with a credit limit and payment terms → appears in the list
4. **Products**: create a product with a tax rate → appears in the list
5. **Orders**: create a draft order for 4 units → server computes subtotal/tax/total correctly
   → confirm the order → an invoice is generated automatically with the right due date
6. **Orders (PDF)**: download the order as a PDF → a valid, readable PDF file is returned
7. **Payments**: record a partial payment against the invoice → outstanding balance updates
   correctly
8. **Credit limit enforcement**: attempt to confirm a second order that would push the
   customer over their credit limit → correctly blocked with a clear error message
9. **Admin dashboard (real browser)**: sign in through the actual login page → land on a
   dashboard showing live counts from the API → navigate to Customers → see the real data →
   create a new customer through the UI form → it appears in the list without a page reload

Every one of these passed. Screenshots and raw API responses from this run are available on
request — they weren't committed to the repo since they're a point-in-time development
artifact, not part of the application.

## Layer 3: Automated end-to-end tests (Phase 2)

Recommended tool: **Playwright**, since it's already used for the manual verification above
and the browser is pre-configured in this environment. The nine steps above are the exact
script to automate first — they already exercise the riskiest paths (money, permissions,
data integrity).

## What's explicitly out of scope for Phase 1

- **Load/performance testing** — worth doing once there's a realistic traffic estimate (how
  many retailers, how many concurrent orders) — ask when you're closer to launch and we'll
  set a target and test against it.
- **Penetration testing** — recommended before handling real customer financial data at
  scale; a reasonable milestone is "before onboarding the first real distributor," not before
  Phase 1 code review.
