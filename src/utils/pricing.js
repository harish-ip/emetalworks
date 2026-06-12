// Central pricing shared by the public calculator and the admin quote tool.
// The owner edits these rates in Admin → Quotation → Pricing Settings; the
// website calculator fetches them on load and falls back to DEFAULT_PRICING
// when the backend is unreachable.

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const host = window.location?.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5001';
  }

  return 'https://emetalworks-backend.onrender.com';
};

const API_BASE_URL = resolveApiBaseUrl();

export const DEFAULT_PRICING = {
  // Metal base rates per kg (₹)
  metalRates: {
    steel: 68,          // Mild Steel / MS sections
    stainless: 275      // Stainless Steel 304 sections/pipes
  },

  // Fabrication labour, welding, cutting, grinding and shop overhead per kg.
  fabricationRates: {
    steel: 105,
    stainless: 160
  },

  // Finishing and installation allowances per sq.ft.
  finishingRates: {
    steel: 45,
    stainless: 20
  },

  installationRates: {
    window: 55,
    security: 70,
    decorative: 85,
    balcony: 95,
    gate: 120,
    staircase: 120
  },

  // Grill complexity multipliers (affects final price)
  grillComplexity: {
    window: 1.0,        // Window Grills - Standard fabrication
    security: 1.3,      // Security Grills - Reinforced, thicker bars
    decorative: 1.5,    // Decorative Grills - Intricate designs, artistic work
    balcony: 1.2,       // Balcony Railings - Height requirements, safety standards
    gate: 1.4,          // Gate Grills - Heavy-duty hinges, locking mechanisms
    staircase: 1.6      // Staircase Railings - Complex angles, precise measurements
  },

  wastagePercent: 7,
  minimumCharge: 2500
};

// Merge server values over local defaults so a missing/partial response can
// never produce NaN prices in the calculator.
export const mergePricing = (serverPricing) => {
  if (!serverPricing || typeof serverPricing !== 'object') return DEFAULT_PRICING;
  const merged = { ...DEFAULT_PRICING };
  for (const group of ['metalRates', 'fabricationRates', 'finishingRates', 'installationRates', 'grillComplexity']) {
    merged[group] = { ...DEFAULT_PRICING[group] };
    const incoming = serverPricing[group];
    if (incoming && typeof incoming === 'object') {
      for (const [key, value] of Object.entries(incoming)) {
        const num = Number(value);
        if (isFinite(num) && num >= 0) merged[group][key] = num;
      }
    }
  }
  for (const key of ['wastagePercent', 'minimumCharge']) {
    const num = Number(serverPricing[key]);
    if (isFinite(num) && num >= 0) merged[key] = num;
  }
  if (serverPricing.updatedAt) merged.updatedAt = serverPricing.updatedAt;
  return merged;
};

export const fetchPricing = async () => {
  const response = await fetch(`${API_BASE_URL}/api/pricing`);
  if (!response.ok) throw new Error(`Pricing fetch failed: ${response.status}`);
  const result = await response.json();
  return mergePricing(result?.data);
};

export const savePricing = async (pricing, token) => {
  const response = await fetch(`${API_BASE_URL}/api/pricing`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(pricing)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.message || `Pricing save failed: ${response.status}`);
  }
  return mergePricing(result.data);
};
