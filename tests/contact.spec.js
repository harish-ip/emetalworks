import { test, expect } from '@playwright/test';

test.describe('Contact Form Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Click on the Contact Us tab
    await page.click('button:has-text("Contact Us")');
  });

  test('should show HTML5 validation on empty submit', async ({ page }) => {
    await page.click('button:has-text("Send Message")');
    // HTML5 validation prevents submission, so name input should be focused
    const isNameFocused = await page.evaluate(() => document.activeElement.name === 'name');
    expect(isNameFocused).toBeTruthy();
  });

  test('should fail if message is too short', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '9876543210');
    await page.fill('input[name="subject"]', 'Qu'); // Too short
    await page.fill('textarea[name="message"]', 'S'); // Too short
    await page.selectOption('select[name="projectType"]', 'window_grill');
    
    await page.click('button:has-text("Send Message")');

    // Wait for the error message or form state to change
    await expect(page.locator('text=Message must be at least 2 characters long.')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully submit valid form', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '9876543210');
    await page.fill('input[name="subject"]', 'Quotation Request');
    await page.fill('textarea[name="message"]', 'This is a test message for the contact form.');
    await page.selectOption('select[name="projectType"]', 'window_grill');
    
    await page.click('button:has-text("Send Message")');

    // Wait for success status
    await expect(page.locator('text=Thank you! Your message has been sent successfully')).toBeVisible({ timeout: 10000 });
  });
});
