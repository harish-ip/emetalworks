import { describe, it, expect } from 'vitest';
import { checkCompliance, getCompliantCheckOptions } from '../src/utils/complianceCheck.js';

// Heights in mm
const H_1200 = 1200; // meets recommended
const H_1100 = 1100; // between min and recommended
const H_900  = 900;  // below minimum

describe('checkCompliance — fall-protection types (balcony, staircase)', () => {
  it('3″ balcony at 1200 mm → compliant, not blocking, no messages', () => {
    const r = checkCompliance({ grillType: 'balcony', checkInches: 3, heightMm: H_1200 });
    expect(r.compliant).toBe(true);
    expect(r.blocking).toBe(false);
    expect(r.messages).toHaveLength(0);
  });

  it('4″ balcony → non-compliant, blocking (gap >= 100 mm)', () => {
    const r = checkCompliance({ grillType: 'balcony', checkInches: 4, heightMm: H_1200 });
    expect(r.compliant).toBe(false);
    expect(r.blocking).toBe(true);
    expect(r.messages[0]).toMatch(/4-inch sphere rule/);
  });

  it('5″ balcony → non-compliant, blocking (gap >= 100 mm)', () => {
    const r = checkCompliance({ grillType: 'balcony', checkInches: 5, heightMm: H_1200 });
    expect(r.compliant).toBe(false);
    expect(r.blocking).toBe(true);
    expect(r.messages[0]).toMatch(/4-inch sphere rule/);
  });

  it('3″ balcony at 900 mm height → blocking (below minimum height)', () => {
    const r = checkCompliance({ grillType: 'balcony', checkInches: 3, heightMm: H_900 });
    expect(r.compliant).toBe(false);
    expect(r.blocking).toBe(true);
    expect(r.messages[0]).toMatch(/NBC 2016/);
  });

  it('3″ balcony at 1100 mm → not blocking, warns about height (below recommended)', () => {
    const r = checkCompliance({ grillType: 'balcony', checkInches: 3, heightMm: H_1100 });
    expect(r.blocking).toBe(false);
    expect(r.messages).toHaveLength(1);
    expect(r.messages[0]).toMatch(/recommended/i);
  });

  it('4″ balcony at 900 mm → blocking, two messages (gap + height)', () => {
    const r = checkCompliance({ grillType: 'balcony', checkInches: 4, heightMm: H_900 });
    expect(r.blocking).toBe(true);
    expect(r.messages.length).toBeGreaterThanOrEqual(2);
  });

  it('3″ staircase at 1200 mm → compliant, not blocking', () => {
    const r = checkCompliance({ grillType: 'staircase', checkInches: 3, heightMm: H_1200 });
    expect(r.compliant).toBe(true);
    expect(r.blocking).toBe(false);
  });

  it('5″ staircase → blocking (gap rule applies)', () => {
    const r = checkCompliance({ grillType: 'staircase', checkInches: 5, heightMm: H_1200 });
    expect(r.blocking).toBe(true);
  });

  it('height = 0 skips height check (not provided)', () => {
    const r = checkCompliance({ grillType: 'balcony', checkInches: 3, heightMm: 0 });
    expect(r.compliant).toBe(true);
    expect(r.blocking).toBe(false);
    expect(r.messages).toHaveLength(0);
  });
});

describe('checkCompliance — warn-only types (window, security)', () => {
  it('5″ window grill → warns, NOT blocking', () => {
    const r = checkCompliance({ grillType: 'window', checkInches: 5, heightMm: 0 });
    expect(r.blocking).toBe(false);
    expect(r.messages).toHaveLength(1);
    expect(r.messages[0]).toMatch(/child-safety/i);
  });

  it('3″ window grill → compliant, no messages', () => {
    const r = checkCompliance({ grillType: 'window', checkInches: 3, heightMm: 0 });
    expect(r.compliant).toBe(true);
    expect(r.messages).toHaveLength(0);
  });

  it('4″ security grill → warns, NOT blocking', () => {
    const r = checkCompliance({ grillType: 'security', checkInches: 4, heightMm: 0 });
    expect(r.blocking).toBe(false);
    expect(r.messages).toHaveLength(1);
  });
});

describe('checkCompliance — other types (gate, decorative)', () => {
  it('5″ gate → no compliance rule applies', () => {
    const r = checkCompliance({ grillType: 'gate', checkInches: 5, heightMm: 0 });
    expect(r.compliant).toBe(true);
    expect(r.blocking).toBe(false);
    expect(r.messages).toHaveLength(0);
  });
});

describe('getCompliantCheckOptions', () => {
  const OPTIONS = [
    { value: '3', label: '3″', desc: 'Fine' },
    { value: '4', label: '4″', desc: 'Standard' },
    { value: '5', label: '5″', desc: 'Open' },
  ];

  it('balcony: 3″ enabled, 4″ and 5″ disabled', () => {
    const result = getCompliantCheckOptions(OPTIONS, 'balcony');
    expect(result.find(o => o.value === '3').disabled).toBeFalsy();
    expect(result.find(o => o.value === '4').disabled).toBe(true);
    expect(result.find(o => o.value === '5').disabled).toBe(true);
  });

  it('window: all options returned without disabled flag', () => {
    const result = getCompliantCheckOptions(OPTIONS, 'window');
    expect(result.every(o => !o.disabled)).toBe(true);
  });

  it('gate: all options returned unchanged', () => {
    const result = getCompliantCheckOptions(OPTIONS, 'gate');
    expect(result).toHaveLength(3);
    expect(result.every(o => !o.disabled)).toBe(true);
  });
});
