// Quote-engine guardrails — business parameters that the formula must read.
// NEVER embed these as magic numbers in calculation code.
//
// VERIFY before launch:
//   • GST_RATE with a CA (works-contract treatment may differ from supply)
//   • MIN_GROSS_MARGIN with the business owner (covers overhead + risk)
//   • QUOTE_VALIDITY_DAYS reflects steel price volatility (7 days is conservative)

export const PRICING_GUARDRAILS = {
  // 18% GST — works-contract composite supply. VERIFY with a CA.
  GST_RATE: 0.18,

  // Any auto-quote older than this is expired; customer must re-request.
  QUOTE_VALIDITY_DAYS: 7,

  // Floor guard: the system must never quote below this gross-margin fraction.
  // If the computed price < cost * (1 + MIN_GROSS_MARGIN), it is clamped up
  // and flagged belowFloor: true for internal review.
  MIN_GROSS_MARGIN: 0.25,

  // ± variance shown as a range on all estimates to reflect real-world
  // uncertainty in weight, site conditions and material batch.
  ESTIMATE_VARIANCE_PCT: 10,

  // Optional surcharge multipliers. All default to 0 (no effect) until the
  // owner sets the values that match the actual business cost structure.
  SURCHARGE: {
    floor_above_ground_pct_per_floor: 0, // % per extra floor above ground
    difficult_access_pct: 0,             // % uplift for hard-to-reach sites
    transport_flat: 0,                   // flat ₹ add-on for transport
    complex_design_pct: 0,              // % uplift for intricate patterns
    powder_coat_pct: 0,                 // % uplift for powder-coat finish
  },
};

/**
 * applyGuardrails(basePrice, baseCost)
 * Applies the margin floor and returns the guarded price.
 * Returns { price, belowFloor }
 */
export function applyGuardrails(basePrice, baseCost) {
  const floor = baseCost * (1 + PRICING_GUARDRAILS.MIN_GROSS_MARGIN);
  if (basePrice < floor) {
    return { price: floor, belowFloor: true };
  }
  return { price: basePrice, belowFloor: false };
}

/**
 * buildQuoteRange(price)
 * Returns { low, high, gst, totalWithGst, validUntil } for display.
 */
export function buildQuoteRange(price) {
  const v = PRICING_GUARDRAILS.ESTIMATE_VARIANCE_PCT / 100;
  const low = Math.round(price * (1 - v));
  const high = Math.round(price * (1 + v));
  const gst = Math.round(price * PRICING_GUARDRAILS.GST_RATE);
  const totalWithGst = Math.round(price * (1 + PRICING_GUARDRAILS.GST_RATE));
  const validUntil = new Date(
    Date.now() + PRICING_GUARDRAILS.QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000
  ).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return { low, high, gst, totalWithGst, validUntil };
}
