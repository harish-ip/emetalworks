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

  test('WhatsApp lead modal — shows, captures name+phone, POSTs lead', async ({ page }) => {
    await page.fill('input[placeholder="Enter width"]', '4');
    await page.fill('input[placeholder="Enter height"]', '5');
    await expect(page.getByTestId('est-cost')).toBeVisible({ timeout: 10000 });

    // Intercept the lead POST
    let capturedBody = null;
    await page.route('**/api/contact/whatsapp-lead', async (route) => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, submissionId: 'test-id' }) });
    });

    // Clicking the button should open the modal, not navigate away
    await page.click('button:has-text("Get this quote on WhatsApp")');
    await expect(page.locator('text=Send your quote on WhatsApp')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Enter your name and number')).toBeVisible();

    // Fill the modal form
    await page.fill('input[placeholder="e.g. Siva"]', 'Test User');
    await page.fill('input[placeholder="e.g. 9876543210"]', '9876543210');

    // Submit — button should be enabled now
    await page.click('button:has-text("Open WhatsApp")');

    // Modal should close and lead should have been POSTed
    await expect(page.locator('text=Send your quote on WhatsApp')).toBeHidden({ timeout: 5000 });
    await expect.poll(() => capturedBody, { timeout: 5000 }).not.toBeNull();
    expect(capturedBody.name).toBe('Test User');
    expect(capturedBody.phone).toBe('9876543210');
    expect(capturedBody.calculatorData).not.toBeNull();
  });

  test('WhatsApp lead modal — Cancel closes without POSTing', async ({ page }) => {
    await page.fill('input[placeholder="Enter width"]', '3');
    await page.fill('input[placeholder="Enter height"]', '4');
    await expect(page.getByTestId('est-cost')).toBeVisible({ timeout: 10000 });

    let posted = false;
    await page.route('**/api/contact/whatsapp-lead', async (route) => {
      posted = true;
      await route.continue();
    });

    await page.click('button:has-text("Get this quote on WhatsApp")');
    await expect(page.locator('text=Send your quote on WhatsApp')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Send your quote on WhatsApp')).toBeHidden({ timeout: 5000 });
    expect(posted).toBe(false);
  });
});
