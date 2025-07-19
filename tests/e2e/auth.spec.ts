import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FixFlow/); // Assuming the title is now FixFlow
  });

  test('user can sign up', async ({ page }) => {
    await page.goto('/signup');

    // Generate unique email for each test run to avoid conflicts
    const uniqueEmail = `test-signup-${Date.now()}@example.com`;
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1:has-text("Schedule")')).toBeVisible(); // Verify successful login to dashboard
  });

  test('user can log in', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com'); // Use a known test user
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1:has-text("Schedule")')).toBeVisible();
  });

  test('user can log out', async ({ page }) => {
    // This test will start with an authenticated session due to globalSetup
    await page.goto('/dashboard'); // Go to a protected route

    // Click on user avatar/menu to reveal logout button
    await page.click('button[aria-label="User menu"]'); // Assuming a common user menu button
    await page.click('text=Logout'); // Assuming a logout button with this text

    await expect(page).toHaveURL('/login'); // Redirected to login page after logout
    await expect(page.locator('text=Sign in to your account')).toBeVisible(); // Verify login page content
  });

  test('password reset flow', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // Expect a success message or redirection to a confirmation page
    await expect(page.locator('text=Password reset email sent')).toBeVisible(); // Assuming a success message
    // In a real test, you might check the email inbox for the reset link.
  });
});