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

const sampleContacts = [
  {
    _id: 'c-1',
    name: 'Alice Iyer',
    email: 'alice@example.com',
    phone: '9876543210',
    subject: 'Window Grills Quote',
    message: 'Need quote for 4 windows on second floor.',
    projectType: 'window_grill',
    status: 'new',
    submissionDate: new Date().toISOString(),
    adminNotes: [],
    calculatorData: {
      dimensions: { width: 4, height: 4, widthUnit: 'ft', heightUnit: 'ft' },
      grillType: 'window',
      metalType: 'steel',
      estimatedCost: 12500
    }
  },
  {
    _id: 'c-2',
    name: 'Bharath Kumar',
    email: 'bharath@example.com',
    phone: '9123456780',
    subject: 'Main Gate',
    message: 'Wrought iron gate, 8ft wide.',
    projectType: 'gate',
    status: 'contacted',
    submissionDate: new Date().toISOString(),
    adminNotes: [
      { note: 'Called once, no answer', addedBy: 'admin', addedAt: new Date().toISOString() }
    ]
  }
];

async function mockAdminApi(page, contacts = sampleContacts) {
  await page.route('**/api/admin/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, token: 'mock-token' })
    })
  );

  await page.route('**/api/admin/dashboard**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          totalVisits: 100,
          totalContacts: contacts.length,
          conversionRate: 10,
          recentContacts: contacts
        }
      })
    })
  );

  await page.route('**/api/contact/submissions', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { submissions: contacts } })
    })
  );
}

async function loginAndOpenContacts(page) {
  await mockAdminApi(page);
  await page.goto('/admin');
  await page.fill('input[placeholder="Username"]', 'admin');
  await page.fill('input[placeholder="Password"]', 'admin123');
  await page.click('button:has-text("Login")');
  await page.click('button:has-text("Contacts")');
  await expect(page.locator('text=Contact Management')).toBeVisible();
}

test.describe('Contact Management Table', () => {
  test('renders required columns and contact rows', async ({ page }) => {
    await loginAndOpenContacts(page);

    for (const header of ['Name', 'Phone Number', 'Project Type', 'Comments', 'Status', 'Remarks']) {
      await expect(page.locator('th', { hasText: header })).toBeVisible();
    }

    await expect(page.locator('td', { hasText: 'Alice Iyer' })).toBeVisible();
    await expect(page.locator('td', { hasText: '9876543210' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Window Grills Quote' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Need quote for 4 windows on second floor.' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Bharath Kumar' })).toBeVisible();
  });

  test('status dropdown PUTs new status (Completed maps to closed)', async ({ page }) => {
    await loginAndOpenContacts(page);

    let statusBody = null;
    await page.route('**/api/contact/submission/c-1/status', async (route) => {
      statusBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'c-1', status: statusBody.status } })
      });
    });

    const aliceRow = page.locator('tr', { has: page.locator('td', { hasText: 'Alice Iyer' }) });
    await aliceRow.locator('select').selectOption('closed');

    await expect.poll(() => statusBody).not.toBeNull();
    expect(statusBody.status).toBe('closed');

    const completedOption = aliceRow.locator('select option[value="closed"]');
    await expect(completedOption).toHaveText('Completed');
  });

  test('remarks modal lists existing notes and posts a new one', async ({ page }) => {
    await loginAndOpenContacts(page);

    let noteBody = null;
    await page.route('**/api/contact/submission/c-2/note', async (route) => {
      noteBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'c-2', noteCount: 2 } })
      });
    });

    const bharathRow = page.locator('tr', { has: page.locator('td', { hasText: 'Bharath Kumar' }) });
    await bharathRow.locator('button', { hasText: 'Notes' }).click();

    await expect(page.locator('text=Remarks for Bharath Kumar')).toBeVisible();
    await expect(page.locator('text=Called once, no answer')).toBeVisible();

    await page.fill('textarea[placeholder="Enter remark..."]', 'Follow up Monday');
    await page.click('button:has-text("Save Remark")');

    await expect.poll(() => noteBody).not.toBeNull();
    expect(noteBody.note).toBe('Follow up Monday');
  });

  test('search and status filter narrow visible rows', async ({ page }) => {
    await loginAndOpenContacts(page);

    await page.fill('input[placeholder="Search contacts..."]', 'Alice');
    await expect(page.locator('td', { hasText: 'Alice Iyer' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Bharath Kumar' })).toHaveCount(0);

    await page.fill('input[placeholder="Search contacts..."]', '');

    const filterSelect = page.locator('select:has(option[value="all"])');
    await filterSelect.selectOption('contacted');
    await expect(page.locator('td', { hasText: 'Bharath Kumar' })).toBeVisible();
    await expect(page.locator('td', { hasText: 'Alice Iyer' })).toHaveCount(0);
  });

  test('clicking name opens Details modal with calculator data', async ({ page }) => {
    await loginAndOpenContacts(page);

    const aliceRow = page.locator('tr', { has: page.locator('td', { hasText: 'Alice Iyer' }) });
    await aliceRow.locator('button', { hasText: 'Alice Iyer' }).click();

    const modal = page.getByTestId('details-modal');
    await expect(modal).toBeVisible();

    await expect(modal.getByRole('heading', { name: 'Alice Iyer' })).toBeVisible();
    await expect(modal.getByText('Need quote for 4 windows on second floor.')).toBeVisible();
    await expect(modal.getByText('window_grill')).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Calculator Data' })).toBeVisible();

    await modal.locator('button:has-text("Close")').click();
    await expect(modal).toBeHidden();
  });
});
