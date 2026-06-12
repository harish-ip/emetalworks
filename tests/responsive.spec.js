import { test, expect } from '@playwright/test';

// 'load' waits for the large Unsplash hero images, which is slow and flaky
// under parallel workers — the app is interactive after DOM content loads.
const gotoHome = (page) => page.goto('/', { waitUntil: 'domcontentloaded' });

// Scoped to the sticky bottom action bar — the contact tab has its own tel: link
const TEL_LINK = '.fixed.bottom-0 a[href^="tel:"]';
const FLOATING_WA = 'a[aria-label="Chat with eMetalWorks on WhatsApp"]';

// ─── Desktop Chrome Tests ─────────────────────────────────────────────────────

test.describe('Desktop Chrome — Layout & Navigation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('should show top tab navigation', async ({ page }) => {
    await gotoHome(page);
    for (const label of ['Home', 'Services', 'Get a Quote', 'Portfolio', 'Contact Us']) {
      await expect(page.locator(`button:has-text("${label}")`).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('should NOT show mobile action bar on desktop', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator(TEL_LINK)).toBeHidden();
  });

  test('should show floating WhatsApp button on desktop', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator(FLOATING_WA)).toBeVisible();
  });

  test('should navigate to Services tab', async ({ page }) => {
    await gotoHome(page);
    await page.click('button:has-text("Services")');
    await expect(page.locator('text=Our Services')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to Contact tab', async ({ page }) => {
    await gotoHome(page);
    await page.click('button:has-text("Contact Us")');
    await expect(page.locator('text=Send Message').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show WhatsApp option in contact tab', async ({ page }) => {
    await gotoHome(page);
    await page.click('button:has-text("Contact Us")');
    await expect(page.locator('text=Chat directly on WhatsApp')).toBeVisible({ timeout: 5000 });
  });

  test('should calculate and display results on desktop', async ({ page }) => {
    await gotoHome(page);
    await page.click('button:has-text("Get a Quote")');
    await page.fill('input[placeholder="Enter width"]', '4');
    await page.fill('input[placeholder="Enter height"]', '5');
    // Live estimate appears in the eMetal Calculator brand panel
    await expect(page.getByTestId('est-cost')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Est. Weight').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show quote CTAs after calculation', async ({ page }) => {
    await gotoHome(page);
    await page.click('button:has-text("Get a Quote")');
    await page.fill('input[placeholder="Enter width"]', '4');
    await page.fill('input[placeholder="Enter height"]', '5');
    await expect(page.getByTestId('est-cost')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Get this quote on WhatsApp')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Send for Final Quote")')).toBeVisible();
  });
});

// ─── Mobile Chrome Tests (Pixel 5) ───────────────────────────────────────────

test.describe('Mobile Chrome — Layout & Navigation', () => {
  test.use({ viewport: { width: 393, height: 851 } });

  test('should show sticky bottom action bar on mobile', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator(TEL_LINK)).toBeVisible({ timeout: 8000 });
    await expect(page.locator('button:has-text("Get Quote")')).toBeVisible();
  });

  test('should hide desktop floating WhatsApp on mobile', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator(FLOATING_WA)).toBeHidden();
  });

  test('should open calculator from bottom bar Get Quote', async ({ page }) => {
    await gotoHome(page);
    await page.click('button:has-text("Get Quote")');
    await expect(page.locator('text=eMetal Calculator').first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate using top tabs — Services', async ({ page }) => {
    await gotoHome(page);
    await page.locator('button:has-text("Services")').first().click();
    await expect(page.locator('text=Our Services')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate using top tabs — Contact', async ({ page }) => {
    await gotoHome(page);
    await page.locator('button:has-text("Contact")').first().click();
    await expect(page.locator('text=Send Message').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show WhatsApp option in contact tab on mobile', async ({ page }) => {
    await gotoHome(page);
    await page.locator('button:has-text("Contact")').first().click();
    await expect(page.locator('text=Chat directly on WhatsApp')).toBeVisible({ timeout: 5000 });
  });

  test('should calculate and show results on mobile', async ({ page }) => {
    await gotoHome(page);
    await page.click('button:has-text("Get Quote")');
    await page.fill('input[placeholder="Enter width"]', '3');
    await page.fill('input[placeholder="Enter height"]', '4');
    await expect(page.getByTestId('est-cost')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Est. Weight').first()).toBeVisible({ timeout: 5000 });
  });

  test('should have touch-friendly bottom bar buttons (min 44px height)', async ({ page }) => {
    await gotoHome(page);
    const callButton = page.locator(TEL_LINK);
    await expect(callButton).toBeVisible({ timeout: 5000 });
    const box = await callButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('should pre-fill project type when using Get a Quote from services', async ({ page }) => {
    await gotoHome(page);
    await page.locator('button:has-text("Services")').first().click();
    await expect(page.locator('text=Our Services')).toBeVisible({ timeout: 5000 });
    // Click Get a Quote on the first service card
    await page.locator('button:has-text("Get a Quote")').first().click();
    // Go to contact and check the projectType dropdown got pre-filled
    await page.locator('button:has-text("Contact")').first().click();
    const select = page.locator('select[name="projectType"]');
    await expect(select).toHaveValue(/window_grill|balcony_grill|gate|staircase|custom/, { timeout: 5000 });
  });

  test('WhatsApp links should include correct phone number', async ({ page }) => {
    await gotoHome(page);
    const href = await page.locator('a[href*="wa.me"]').first().getAttribute('href');
    expect(href).toContain('919985393064');
  });
});

// ─── PWA Tests ────────────────────────────────────────────────────────────────

test.describe('PWA Readiness', () => {
  test('should have web app manifest linked', async ({ page }) => {
    await gotoHome(page);
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
    await gotoHome(page);
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();
  });

  test('should have apple-mobile-web-app-capable meta', async ({ page }) => {
    await gotoHome(page);
    const iosMeta = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content');
    expect(iosMeta).toBe('yes');
  });
});
