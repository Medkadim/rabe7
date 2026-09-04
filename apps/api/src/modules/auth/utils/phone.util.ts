import { parsePhoneNumberFromString } from "libphonenumber-js";

// Two different typings of the same number (spaces, dashes, no leading
// zero...) must resolve to one identical stored value, or a customer typing
// their number slightly differently at login than at signup would silently
// fail to match. "MA" lets a local Moroccan number (e.g. "0612345678") parse
// without a country code — the only market this runs in today — while a
// number that already includes "+212" (or another country code) still
// parses correctly since an explicit "+" always overrides the default.
// Returns E.164 (e.g. "+212612345678") or null if the input isn't a valid
// phone number at all.
export function normalizePhone(value: string): string | null {
  try {
    const parsed = parsePhoneNumberFromString(value, "MA");
    return parsed?.isValid() ? parsed.format("E.164") : null;
  } catch {
    return null;
  }
}
