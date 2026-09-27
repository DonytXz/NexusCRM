import { test, expect } from '@playwright/test';

test.describe('NexusCRM Operations & 360 Profile Drawer', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate with DummyJSON credentials
    await page.goto('login');
    await page.fill('input[formControlName="username"]', 'emilys');
    await page.fill('input[formControlName="password"]', 'emilyspass');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/clients');
  });

  test('should display the executive KPI metrics banner', async ({ page }) => {
    const kpiBanner = page.locator('.kpi-banner');
    await expect(kpiBanner).toBeVisible();
    await expect(page.locator('.kpi-box')).toHaveCount(4);
  });

  test('should filter clients via search input', async ({ page }) => {
    const searchInput = page.locator('.custom-search input');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Laura');
    const tableRows = page.locator('.crm-table tbody tr.data-row');
    await expect(tableRows.first()).toContainText('Laura Martinez');
  });

  test('should open and close the Client 360 Drawer on row click', async ({ page }) => {
    // Click on the first client row
    const firstClientCell = page.locator('.crm-table tbody tr.data-row .clickable-cell').first();
    await firstClientCell.click();

    // Verify drawer opens
    const drawer = page.locator('app-client-detail-drawer .drawer-container');
    await expect(drawer).toHaveClass(/open/);

    // Verify metrics and contact actions in drawer
    await expect(page.locator('.drawer-metrics')).toBeVisible();

    // Close drawer
    const closeBtn = page.locator('.drawer-header button[title="Cerrar Ficha"]');
    await closeBtn.click();
    await expect(drawer).not.toHaveClass(/open/);
  });
});
