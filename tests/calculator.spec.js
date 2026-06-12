import { test, expect } from '@playwright/test';

test.describe('Calculator Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Click on the Get a Quote tab
    await page.click('button:has-text("Get a Quote")');
  });

  test('should have default units as feet (ft)', async ({ page }) => {
    // Check width unit dropdown next to width input
    const widthUnit = await page.inputValue('select:right-of(input[placeholder="Enter width"])');
    expect(widthUnit).toBe('ft');

    // Check height unit dropdown next to height input
    const heightUnit = await page.inputValue('select:right-of(input[placeholder="Enter height"])');
    expect(heightUnit).toBe('ft');
  });

  test('should show brand panel with steps before entering dimensions', async ({ page }) => {
    await expect(page.locator('text=eMetal Calculator').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Enter width and height')).toBeVisible();
  });

  test('should calculate valid standard grill weight and cost', async ({ page }) => {
    // Fill in width and height
    await page.fill('input[placeholder="Enter width"]', '4');
    await page.fill('input[placeholder="Enter height"]', '4');

    // Live estimate appears in the brand panel with non-zero weight and cost
    await expect(page.getByTestId('est-cost')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('est-cost')).not.toHaveText('₹0*');
    await expect(page.getByTestId('est-weight').locator('p').first()).not.toHaveText('0');
    await expect(page.locator('text=Get this quote on WhatsApp')).toBeVisible();
  });
});
