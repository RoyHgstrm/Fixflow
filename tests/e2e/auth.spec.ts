import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/T3 App/);
});

test('user can sign up', async ({ page }) => {
  await page.goto('http://localhost:3000/signup');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('http://localhost:3000/dashboard');
});

test('user can log in', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('http://localhost:3000/dashboard');
});

test('user can create a customer', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.goto('http://localhost:3000/dashboard/customers');

  await page.click('button:has-text("Create Customer")');

  await page.fill('input[name="name"]', 'Test Customer');
  await page.fill('input[name="email"]', 'customer@example.com');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Test Customer')).toBeVisible();
});