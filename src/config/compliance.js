// Safety & building-code compliance parameters.
// IMPORTANT: These values are derived from NBC 2016 / IS 1148:2021 and the
// 4-inch sphere rule. VERIFY exact limits with a structural engineer and your
// local municipal bylaws before launch.

export const COMPLIANCE = {
  // Clear gap between adjacent bars must be < 100 mm (4-inch sphere / child
  // head-entrapment rule). A 100 mm gap can trap a child's head; safe limit
  // is strictly less than 100 mm.
  MAX_CLEAR_GAP_MM: 100,

  // NBC 2016 cl.5.9: minimum guard-rail height for fall protection.
  // Confirm applicable floor threshold and local bylaws with an engineer.
  MIN_RAILING_HEIGHT_MM: 1050,
  RECOMMENDED_RAILING_HEIGHT_MM: 1200,

  // Work types that are fall-protection / guards — gap AND height are
  // enforced strictly; no price is shown while non-compliant.
  FALL_PROTECTION_TYPES: ['balcony', 'staircase'],

  // Types often installed on upper floors but not strictly classified as
  // fall-protection — warn if gap is wide, but do not block the price.
  WARN_TYPES: ['window', 'security'],

  INCH_TO_MM: 25.4,
};
