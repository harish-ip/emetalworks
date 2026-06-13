// Balcony grill weight estimator — shop formula decoded from fabricator notes.
// All physical constants are in BALCONY_CONFIG so they can be tuned without
// touching the formula itself.
export const BALCONY_CONFIG = {
  ANGLE_KG_PER_FT: 6.5 / 18,   // 25×25×3mm MS angle: 18 ft stock = 6.5 kg → 0.3611 kg/ft
  ROD_KG_PER_FT: 4.5 / 18,     // 10mm square rod: 18 ft stock = 4.5 kg → 0.2500 kg/ft
  BOX_PROJECTION_IN: 15,        // box projects 15″ per side (adds 30″ to each plan dimension)
  STOCK_LEN_FT: 18,             // standard bar stock length (informational)
  WASTAGE_PCT: 5,               // cutting/welding wastage — calibratable
};

/**
 * calculateBalconyGrill — pure function, no side effects.
 *
 * @param {object} params
 * @param {number} params.W_in    Width in inches (plan size, not box-expanded)
 * @param {number} params.H_in    Height in inches
 * @param {number} [params.qty]   Number of identical units (default 1)
 * @param {number} [params.check] Clear gap between bars in inches: 3, 4 or 5 (default 4)
 * @param {string} [params.type]  'plain' | 'box' (default 'box')
 * @param {object} [params.config] Partial overrides for BALCONY_CONFIG constants
 * @returns {{ perUnit, total, breakdown }}
 */
export function calculateBalconyGrill({
  W_in,
  H_in,
  qty = 1,
  check = 4,
  type = 'box',
  config = {},
}) {
  const { ANGLE_KG_PER_FT, ROD_KG_PER_FT, BOX_PROJECTION_IN, WASTAGE_PCT } = {
    ...BALCONY_CONFIG,
    ...config,
  };

  const pitch_in = check + 0.5; // clear gap + ~rod thickness (3→3.5, 4→4.5, 5→5.5)

  // Working plan size — box grows by projection on every side
  const Wg = type === 'box' ? W_in + 2 * BOX_PROJECTION_IN : W_in;
  const Hg = type === 'box' ? H_in + 2 * BOX_PROJECTION_IN : H_in;

  // Frame (angle iron)
  // plain: simple perimeter; box: front perimeter + outer perimeter + side transitions
  const Lframe_in =
    type === 'plain'
      ? 2 * (W_in + H_in)
      : 4 * (W_in + H_in) + 8 * BOX_PROJECTION_IN;
  const frameKg = (Lframe_in / 12) * ANGLE_KG_PER_FT;

  // Infill bars (square rod) — full grid in both directions
  const nVert = Math.round(Wg / pitch_in); // vertical bars, each spans height Hg
  const nHorz = Math.round(Hg / pitch_in); // horizontal bars, each spans width Wg
  const Lrod_in = nVert * Hg + nHorz * Wg;
  const rodKg = (Lrod_in / 12) * ROD_KG_PER_FT;

  const unitWeightKg = (frameKg + rodKg) * (1 + WASTAGE_PCT / 100);
  const totalLengthIn = Lframe_in + Lrod_in;

  return {
    perUnit: { frameKg, rodKg, weightKg: unitWeightKg },
    total: { weightKg: unitWeightKg * qty, qty },
    breakdown: {
      nVert,
      nHorz,
      pitchIn: pitch_in,
      Wg,
      Hg,
      type,
      checkIn: check,
      Lframe_in,
      Lrod_in,
      totalLengthIn,
    },
  };
}
