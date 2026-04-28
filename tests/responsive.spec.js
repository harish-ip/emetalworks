import { test, expect } from '@playwright/test';

// ─── Desktop Chrome Tests ─────────────────────────────────────────────────────

test.describe('Desktop Chrome — Layout & Navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should open on calculator tab by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=eMetalWorks Calculator')).toBeVisible({ timeout: 8000 });
  });

  test('should show top tab navigation on desktop', async ({ page }) => {
    await page.goto('/');
    // Top nav bar should be visible
    const topNav = page.locator('button:has-text("Get Quote")').first();
    await expect(topNav).toBeVisible();
  });

  test('should NOT show bottom mobile nav on desktop', async ({ page }) => {
    await page.goto('/');
    const bottomNav = page.locator('nav.md\\:hidden');
    await expect(bottomNav).toBeHidden();
  });

  test('should navigate to Services tab', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Services")');
    await expect(page.locator('text=Our Services')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to Contact tab', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Contact Us")');
    await expect(page.locator('text=Send Message')).toBeVisible({ timeout: 5000 });
  });

  test('should show WhatsApp button in contact form', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Contact Us")');
    await expect(page.locator('text=Chat on WhatsApp')).toBeVisible({ timeout: 5000 });
  });

  test('should calculate and display results on desktop', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="Enter width"]', '4');
    await page.fill('input[placeholder="Enter height"]', '5');
    // Order Summary panel appears with weight and cost
    await expect(page.locator('text=Order Summary').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Est. Weight').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Total Estimate').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show Get a Quote CTA button after calculation', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="Enter width"]', '4');
    await page.fill('input[placeholder="Enter height"]', '5');
    await expect(page.locator('text=Order Summary').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Get Detailed Quote")').first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── Mobile Chrome Tests (Pixel 5) ───────────────────────────────────────────

test.describe('Mobile Chrome — Layout & Navigation', () => {
  test.use({ viewport: { width: 393, height: 851 } });

  test('should open on calculator screen on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=eMetalWorks Calculator')).toBeVisible({ timeout: 8000 });
  });

  test('should show sticky mobile header', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header.md\\:hidden');
    await expect(header).toBeVisible();
    await expect(header.locator('text=eMetalWorks')).toBeVisible();
  });

  test('should show bottom navigation bar on mobile', async ({ page }) => {
    await page.goto('/');
    const bottomNav = page.locator('nav').filter({ hasText: 'Quote' }).last();
    await expect(bottomNav).toBeVisible({ timeout: 5000 });
  });

  test('should navigate using bottom nav — Services tab', async ({ page }) => {
    await page.goto('/');
    // Click bottom nav Services button
    const bottomNavServices = page.locator('nav').last().locator('button:has-text("Services")');
    await bottomNavServices.click();
    await expect(page.locator('text=Our Services')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate using bottom nav — Contact tab', async ({ page }) => {
    await page.goto('/');
    const bottomNavContact = page.locator('nav').last().locator('button:has-text("Contact")');
    await bottomNavContact.click();
    await expect(page.locator('text=Send Message')).toBeVisible({ timeout: 5000 });
  });

  test('should show floating WhatsApp button on mobile', async ({ page }) => {
    await page.goto('/');
    const whatsappBtn = page.locator('a[aria-label="Chat on WhatsApp"]');
    await expect(whatsappBtn).toBeVisible({ timeout: 5000 });
  });

  test('should show WhatsApp button in contact form on mobile', async ({ page }) => {
    await page.goto('/');
    const bottomNavContact = page.locator('nav').last().locator('button:has-text("Contact")');
    await bottomNavContact.click();
    await expect(page.locator('text=Chat on WhatsApp')).toBeVisible({ timeout: 5000 });
  });

  test('should calculate and show results on mobile', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="Enter width"]', '3');
    await page.fill('input[placeholder="Enter height"]', '4');
    await expect(page.locator('text=Order Summary').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Est. Weight').first()).toBeVisible({ timeout: 5000 });
  });

  test('should have touch-friendly bottom nav buttons (min 44px height)', async ({ page }) => {
    await page.goto('/');
    // The bottom nav has h-16 (64px) - each button fills full height
    const bottomNav = page.locator('nav').last();
    await expect(bottomNav).toBeVisible({ timeout: 5000 });
    const navBox = await bottomNav.boundingBox();
    expect(navBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('should pre-fill project type when using Get a Quote from services', async ({ page }) => {
    await page.goto('/');
    // Go to services
    const bottomNavServices = page.locator('nav').last().locator('button:has-text("Services")');
    await bottomNavServices.click();
    await expect(page.locator('text=Our Services')).toBeVisible({ timeout: 5000 });
    // Click Get a Quote on Window Grills
    await page.locator('button:has-text("Get a Quote")').first().click();
    // Go to contact
    const bottomNavContact = page.locator('nav').last().locator('button:has-text("Contact")');
    await bottomNavContact.click();
    // Check projectType dropdown is pre-filled
    const select = page.locator('select[name="projectType"]');
    await expect(select).toHaveValue(/window_grill|balcony_grill|gate|staircase|custom/, { timeout: 5000 });
  });

  test('WhatsApp link should include correct phone number', async ({ page }) => {
    await page.goto('/');
    const floatingWA = page.locator('a[aria-label="Chat on WhatsApp"]');
    const href = await floatingWA.getAttribute('href');
    expect(href).toContain('919985393064');
  });
});

// ─── PWA Tests ────────────────────────────────────────────────────────────────

test.describe('PWA Readiness', () => {
  test('should have web app manifest linked', async ({ page }) => {
    await page.goto('/');
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifest).toBe('/manifest.json');
  });

  test('manifest.json should be accessible', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    const body = await response?.json();
    expect(body.name).toBe('eMetalWorks');
    expect(body.display).toBe('standalone');
  });

  test('should have theme-color meta tag', async ({ page }) => {
    await page.goto('/');
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();
  });

  test('should have apple-mobile-web-app-capable meta', async ({ page }) => {
    await page.goto('/');
    const iosMeta = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content');
    expect(iosMeta).toBe('yes');
  });
});
