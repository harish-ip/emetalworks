import { test, expect } from '@playwright/test';

test.describe('Calculator Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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

  test('should calculate valid standard grill weight', async ({ page }) => {
    // Fill in width and height
    await page.fill('input[placeholder="Enter width"]', '4');
    await page.fill('input[placeholder="Enter height"]', '4');
    
    // Total should update automatically. Wait for calculation.
    // Ensure the estimated weight and cost are not zero
    await expect(page.locator('text=Estimated Weight').locator('..').locator('div.text-primary-600')).not.toHaveText('0 kg', { timeout: 5000 });
    await expect(page.locator('text=Estimated Cost').locator('..').locator('div.text-accent-600')).not.toHaveText('₹0');
  });
});
