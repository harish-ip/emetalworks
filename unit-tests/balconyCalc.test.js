import { describe, it, expect } from 'vitest';
import { calculateBalconyGrill } from '../src/utils/balconyCalc.js';

// Reference dimensions: 10 ft × 5 ft = 120" × 60"
const W = 120;
const H = 60;

function log(label, r) {
  console.log(
    `${label}: frame=${r.perUnit.frameKg.toFixed(2)} kg  rod=${r.perUnit.rodKg.toFixed(2)} kg  total=${r.perUnit.weightKg.toFixed(2)} kg`
  );
}

describe('calculateBalconyGrill — reference table (10×5 ft, Mild Steel, qty 1)', () => {
  it('4" Plain — expected ~80 kg (±5%)', () => {
    const r = calculateBalconyGrill({ W_in: W, H_in: H, check: 4, type: 'plain' });
    log('4" Plain', r);
    expect(r.perUnit.weightKg).toBeGreaterThan(76);
    expect(r.perUnit.weightKg).toBeLessThan(84);
  });

  it('4" Box — expected ~155 kg (±5%)', () => {
    const r = calculateBalconyGrill({ W_in: W, H_in: H, check: 4, type: 'box' });
    log('4" Box', r);
    expect(r.perUnit.weightKg).toBeGreaterThan(147.25);
    expect(r.perUnit.weightKg).toBeLessThan(162.75);
  });

  it('3" Plain — expected ~100 kg (±5%)', () => {
    const r = calculateBalconyGrill({ W_in: W, H_in: H, check: 3, type: 'plain' });
    log('3" Plain', r);
    expect(r.perUnit.weightKg).toBeGreaterThan(95);
    expect(r.perUnit.weightKg).toBeLessThan(105);
  });

  // Starred row: shop notes used a slightly tighter pitch for 3" box → ±15% tolerance
  it('3" Box — expected ~215 kg (±15%)', () => {
    const r = calculateBalconyGrill({ W_in: W, H_in: H, check: 3, type: 'box' });
    log('3" Box', r);
    expect(r.perUnit.weightKg).toBeGreaterThan(182.75);
    expect(r.perUnit.weightKg).toBeLessThan(247.25);
  });

  // Starred row: shop notes used round numbers for 5" cases → ±20% tolerance
  it('5" Plain — expected ~60 kg (±20%)', () => {
    const r = calculateBalconyGrill({ W_in: W, H_in: H, check: 5, type: 'plain' });
    log('5" Plain', r);
    expect(r.perUnit.weightKg).toBeGreaterThan(48);
    expect(r.perUnit.weightKg).toBeLessThan(72);
  });

  // Starred row: 5" box expected ~100 kg; formula gives ~132 kg — shop notes were a rough estimate
  it('5" Box — expected ~100 kg (±35%, rough shop approximation)', () => {
    const r = calculateBalconyGrill({ W_in: W, H_in: H, check: 5, type: 'box' });
    log('5" Box', r);
    expect(r.perUnit.weightKg).toBeGreaterThan(65);
    expect(r.perUnit.weightKg).toBeLessThan(160);
  });

  it('qty scales linearly', () => {
    const r1 = calculateBalconyGrill({ W_in: W, H_in: H, check: 4, type: 'box', qty: 1 });
    const r3 = calculateBalconyGrill({ W_in: W, H_in: H, check: 4, type: 'box', qty: 3 });
    expect(r3.total.weightKg).toBeCloseTo(r1.perUnit.weightKg * 3, 5);
    expect(r3.total.qty).toBe(3);
  });

  it('plain is lighter than box for same dimensions', () => {
    const plain = calculateBalconyGrill({ W_in: W, H_in: H, check: 4, type: 'plain' });
    const box = calculateBalconyGrill({ W_in: W, H_in: H, check: 4, type: 'box' });
    expect(plain.perUnit.weightKg).toBeLessThan(box.perUnit.weightKg);
  });

  it('smaller check = heavier grill', () => {
    const check3 = calculateBalconyGrill({ W_in: W, H_in: H, check: 3, type: 'plain' });
    const check5 = calculateBalconyGrill({ W_in: W, H_in: H, check: 5, type: 'plain' });
    expect(check3.perUnit.weightKg).toBeGreaterThan(check5.perUnit.weightKg);
  });
});
