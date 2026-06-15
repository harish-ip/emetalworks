# Launch Risks Checklist

These items cannot be fixed in code. They must be addressed by the business
owner before or shortly after go-live. Tick each off when done.

---

## Insurance

- [ ] **Product / public-liability insurance** — covers injury or property damage
      caused by a fabricated item installed at a customer's premises.
- [ ] **Workmen's compensation insurance** — mandatory under the Employees'
      Compensation Act 1923 if employing workers on-site.

---

## Legal entity & brand identity

- [ ] **Reconcile entity name** — the website presents as "eMetalWorks" but the
      legal entity is "Bhavya Fabrication Works". Ensure all contracts, invoices,
      and GST returns use the registered entity name. Consider registering
      "eMetalWorks" as a trade name or trademark.
- [ ] **Domain ownership** — move off the free `*.onrender.com` subdomain to an
      owned domain (e.g. `emetalworks.in`) before marketing spend begins.
      Outbound WhatsApp links and Google Business listings should point to the
      owned domain.
- [ ] **Trademark search** — verify "eMetalWorks" is available in Class 6
      (metal goods) and Class 37 (construction / installation services) before
      investing in brand-building.

---

## Tax & accounting

- [ ] **GST treatment** — confirm with a CA whether the business falls under
      "works contract" (Sch. II, cl. 6(a) — composite supply including labour and
      material, typically 18%) or a different category. The calculator currently
      shows 18% GST as a works-contract assumption; update `src/config/pricing.js`
      `GST_RATE` if the CA advises otherwise.
- [ ] **GST registration** — ensure GSTIN is obtained and displayed on all
      quotations and invoices if annual turnover exceeds the threshold.
- [ ] **Invoice compliance** — all quotations and invoices must show: GSTIN,
      HSN/SAC code, taxable value, GST rate and amount, entity name, and
      address.

---

## Technical safety (install operations)

- [ ] **Working-at-height procedures** — document a safe-work method statement
      (SWMS) for any installation above 2 metres: scaffolding or harness
      requirements, tool-tether policy, spotter protocol.
- [ ] **Structural sign-off** — for balcony railings, obtain written confirmation
      from the structural engineer that the anchor fixings and slab can carry
      the design load before installation.

---

## Business continuity

- [ ] **Key-person documentation** — document fabrication methods, supplier
      contacts, and pricing logic so the business is not dependent on a single
      person. Store securely (not just on a local hard drive).
- [ ] **Supplier agreements** — formalise pricing agreements with steel
      suppliers; spot-rate buying exposes quotes to price swings inside the
      7-day validity window.

---

## Compliance parameters to verify before launch

The following values are currently set as code defaults. Have them confirmed by
the appropriate professional and update `src/config/compliance.js` /
`src/config/pricing.js` before accepting live orders:

| Parameter | Current default | Verify with |
|---|---|---|
| `MAX_CLEAR_GAP_MM` | 100 mm | Structural engineer + local bylaws |
| `MIN_RAILING_HEIGHT_MM` | 1050 mm | Structural engineer + NBC 2016 cl.5.9 |
| `RECOMMENDED_RAILING_HEIGHT_MM` | 1200 mm | Structural engineer |
| `GST_RATE` | 0.18 (18%) | CA |
| `MIN_GROSS_MARGIN` | 0.25 (25%) | Business owner |
| `QUOTE_VALIDITY_DAYS` | 7 days | Business owner + supplier lead time |
