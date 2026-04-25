import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('should fail login with wrong credentials', async ({ page }) => {
    await page.fill('input[placeholder="Username"]', 'wronguser');
    await page.fill('input[placeholder="Password"]', 'wrongpass');
    await page.click('button:has-text("Login")');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should login with correct credentials', async ({ page }) => {
    await page.fill('input[placeholder="Username"]', 'admin');
    await page.fill('input[placeholder="Password"]', 'admin123');
    await page.click('button:has-text("Login")');

    await expect(page.locator('text=Logout')).toBeVisible();
    await expect(page.locator('text=Recent Contacts')).toBeVisible({ timeout: 10000 });
  });
});
