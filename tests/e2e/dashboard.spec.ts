import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation and Overview', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure user is logged in before each dashboard test
    // Authentication is handled by globalSetup and storageState
    await page.goto('/dashboard');
  });

  test('should navigate to Customers page', async ({ page }) => {
    await page.click('a[href="/dashboard/customers"]'); // Assuming a navigation link
    await expect(page).toHaveURL('/dashboard/customers');
    await expect(page.locator('h1:has-text("Customer Management")')).toBeVisible();
  });

  test('should navigate to Work Orders page', async ({ page }) => {
    await page.click('a[href="/dashboard/work-orders"]');
    await expect(page).toHaveURL('/dashboard/work-orders');
    await expect(page.locator('h1:has-text("Work Order Management")')).toBeVisible();
  });

  test('should navigate to Invoices page', async ({ page }) => {
    await page.click('a[href="/dashboard/invoices"]');
    await expect(page).toHaveURL('/dashboard/invoices');
    await expect(page.locator('h1:has-text("Invoice Management")')).toBeVisible();
  });

  test('should navigate to Team page', async ({ page }) => {
    await page.click('a[href="/dashboard/team"]');
    await expect(page).toHaveURL('/dashboard/team');
    await expect(page.locator('h1:has-text("Team Management")')).toBeVisible();
  });

  test('should navigate to Reports page', async ({ page }) => {
    await page.click('a[href="/dashboard/reports"]');
    await expect(page).toHaveURL('/dashboard/reports');
    await expect(page.locator('h1:has-text("Reports")')).toBeVisible(); // Adjust text if different
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.click('a[href="/dashboard/settings"]');
    await expect(page).toHaveURL('/dashboard/settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
  });

  test('dashboard overview displays key stats', async ({ page }) => {
    // Assuming there are cards or sections displaying stats like total customers, pending work orders, etc.
    await expect(page.locator('text=Total Customers')).toBeVisible();
    await expect(page.locator('text=Pending Work Orders')).toBeVisible();
    await expect(page.locator('text=Total Revenue')).toBeVisible();
  });
});