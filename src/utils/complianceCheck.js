import { COMPLIANCE } from '../config/compliance.js';

/**
 * checkCompliance({ grillType, checkInches, heightMm })
 *
 * Pure function — no side effects, no React state.
 *
 * @param {string}  grillType   - e.g. 'balcony', 'staircase', 'window', 'security'
 * @param {number}  checkInches - clear gap between bars in inches
 * @param {number}  heightMm    - railing/grill height in mm (0 = not provided, skip height check)
 *
 * @returns {{ compliant: boolean, blocking: boolean, messages: string[] }}
 *   compliant — true when the config meets code requirements
 *   blocking  — true when a price MUST NOT be shown (unsafe fall-protection config)
 *   messages  — human-readable reasons (may include non-blocking notices)
 */
export function checkCompliance({ grillType, checkInches, heightMm = 0 }) {
  const {
    MAX_CLEAR_GAP_MM,
    MIN_RAILING_HEIGHT_MM,
    RECOMMENDED_RAILING_HEIGHT_MM,
    FALL_PROTECTION_TYPES,
    WARN_TYPES,
    INCH_TO_MM,
  } = COMPLIANCE;

  const clearGapMm = checkInches * INCH_TO_MM;
  const isFallProtection = FALL_PROTECTION_TYPES.includes(grillType);
  const isWarnType = WARN_TYPES.includes(grillType);

  const messages = [];
  let compliant = true;
  let blocking = false;

  if (isFallProtection) {
    // --- Gap check (blocking) ---
    if (clearGapMm >= MAX_CLEAR_GAP_MM) {
      compliant = false;
      blocking = true;
      messages.push(
        `Bar gap ${checkInches}″ (${Math.round(clearGapMm)} mm) exceeds the ` +
        `${MAX_CLEAR_GAP_MM} mm child-safety limit (4-inch sphere rule). ` +
        `Select 3″ or a custom gap below ${MAX_CLEAR_GAP_MM} mm.`
      );
    }

    // --- Height check (blocking below minimum, warning below recommended) ---
    if (heightMm > 0) {
      if (heightMm < MIN_RAILING_HEIGHT_MM) {
        compliant = false;
        blocking = true;
        messages.push(
          `Railing height ${Math.round(heightMm)} mm is below the minimum ` +
          `${MIN_RAILING_HEIGHT_MM} mm required by NBC 2016 for fall protection. ` +
          `Increase height to at least ${MIN_RAILING_HEIGHT_MM} mm.`
        );
      } else if (heightMm < RECOMMENDED_RAILING_HEIGHT_MM) {
        messages.push(
          `Notice: height ${Math.round(heightMm)} mm is below the ` +
          `${RECOMMENDED_RAILING_HEIGHT_MM} mm recommended minimum for balcony railings.`
        );
      }
    }
  } else if (isWarnType) {
    // --- Wide-gap warning only (not blocking) ---
    if (clearGapMm >= MAX_CLEAR_GAP_MM) {
      compliant = false;
      messages.push(
        `This bar spacing (${checkInches}″ / ${Math.round(clearGapMm)} mm) may not meet ` +
        `child-safety norms if this grill is used as fall protection on an upper floor.`
      );
    }
  }

  return { compliant, blocking, messages };
}

/**
 * getCompliantCheckOptions(allOptions, grillType)
 * Filters a list of { value, label, desc } check options to those that are
 * compliant for the given grillType. For non-fall-protection types, all
 * options are returned unchanged.
 */
export function getCompliantCheckOptions(allOptions, grillType) {
  const { FALL_PROTECTION_TYPES, MAX_CLEAR_GAP_MM, INCH_TO_MM } = COMPLIANCE;
  if (!FALL_PROTECTION_TYPES.includes(grillType)) return allOptions;
  return allOptions.map((opt) => ({
    ...opt,
    disabled: opt.value * INCH_TO_MM >= MAX_CLEAR_GAP_MM,
  }));
}
