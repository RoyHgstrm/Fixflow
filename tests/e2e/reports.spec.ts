
import { test, expect } from '@playwright/test';

test('user can navigate to reports page', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.goto('http://localhost:3000/dashboard/reports');

  await expect(page.locator('text=Total Revenue')).toBeVisible();
  await expect(page.locator('text=Subscriptions')).toBeVisible();
  await expect(page.locator('text=Sales')).toBeVisible();
  await expect(page.locator('text=Active Now')).toBeVisible();
});
