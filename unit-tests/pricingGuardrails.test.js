import { describe, it, expect } from 'vitest';
import { PRICING_GUARDRAILS, applyGuardrails, buildQuoteRange } from '../src/config/pricing.js';

describe('PRICING_GUARDRAILS — config shape', () => {
  it('has all required keys', () => {
    expect(typeof PRICING_GUARDRAILS.GST_RATE).toBe('number');
    expect(typeof PRICING_GUARDRAILS.QUOTE_VALIDITY_DAYS).toBe('number');
    expect(typeof PRICING_GUARDRAILS.MIN_GROSS_MARGIN).toBe('number');
    expect(typeof PRICING_GUARDRAILS.ESTIMATE_VARIANCE_PCT).toBe('number');
    expect(typeof PRICING_GUARDRAILS.SURCHARGE).toBe('object');
  });

  it('GST_RATE is 0.18', () => {
    expect(PRICING_GUARDRAILS.GST_RATE).toBe(0.18);
  });

  it('MIN_GROSS_MARGIN is 0.25', () => {
    expect(PRICING_GUARDRAILS.MIN_GROSS_MARGIN).toBe(0.25);
  });

  it('SURCHARGE defaults are all 0 (no-op until owner sets them)', () => {
    for (const v of Object.values(PRICING_GUARDRAILS.SURCHARGE)) {
      expect(v).toBe(0);
    }
  });
});

describe('applyGuardrails', () => {
  it('price above floor → returned unchanged, belowFloor false', () => {
    const cost = 10000;
    const price = 15000; // > cost * 1.25 = 12500
    const { price: p, belowFloor } = applyGuardrails(price, cost);
    expect(p).toBe(price);
    expect(belowFloor).toBe(false);
  });

  it('price exactly at floor → not flagged', () => {
    const cost = 10000;
    const price = 12500; // = cost * 1.25
    const { price: p, belowFloor } = applyGuardrails(price, cost);
    expect(p).toBe(price);
    expect(belowFloor).toBe(false);
  });

  it('price below floor → clamped to floor, belowFloor true', () => {
    const cost = 10000;
    const price = 11000; // < cost * 1.25 = 12500
    const { price: p, belowFloor } = applyGuardrails(price, cost);
    expect(p).toBe(12500);
    expect(belowFloor).toBe(true);
  });

  it('very cheap price → clamped, never silently quoted under margin', () => {
    const { price: p, belowFloor } = applyGuardrails(100, 5000);
    expect(belowFloor).toBe(true);
    expect(p).toBeGreaterThanOrEqual(5000 * 1.25);
  });
});

describe('buildQuoteRange', () => {
  it('low is 10% below price, high is 10% above', () => {
    const { low, high } = buildQuoteRange(10000);
    expect(low).toBe(9000);
    expect(high).toBe(11000);
  });

  it('gst is 18% of base price (rounded)', () => {
    const { gst } = buildQuoteRange(10000);
    expect(gst).toBe(1800);
  });

  it('totalWithGst is base + 18% gst (rounded)', () => {
    const { totalWithGst } = buildQuoteRange(10000);
    expect(totalWithGst).toBe(11800);
  });

  it('validUntil is a non-empty string (future date)', () => {
    const { validUntil } = buildQuoteRange(10000);
    expect(typeof validUntil).toBe('string');
    expect(validUntil.length).toBeGreaterThan(0);
  });
});
