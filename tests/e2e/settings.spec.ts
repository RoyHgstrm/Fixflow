import { test, expect } from '@playwright/test';

test.describe('User Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Authentication is handled by globalSetup and storageState
    await page.goto('/dashboard/settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
  });

  test('user can update profile information', async ({ page }) => {
    await page.click('button:has-text("Profile")'); // Ensure profile tab is active

    const newName = `Test User ${Date.now()}`;
    await page.fill('input[name="name"]', newName);
    await page.fill('input[name="phone"]', '111-222-3333');
    await page.fill('input[name="jobTitle"]', 'Senior Tester');

    await page.click('button:has-text("Save Profile")');

    await expect(page.locator('text=Profile updated successfully!')).toBeVisible();
    await expect(page.locator(`input[name="name"][value="${newName}"]`)).toBeVisible(); // Verify updated name
  });

  test('user can update company information (admin/owner role)', async ({ page }) => {
    // This test requires an admin/owner user.
    // Authentication is handled by globalSetup and storageState
    await page.goto('/dashboard/settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();

    await page.click('button:has-text("Company")'); // Click company tab

    const newCompanyName = `Test Company ${Date.now()}`;
    await page.fill('input[name="companyName"]', newCompanyName);
    await page.fill('input[name="companyPhone"]', '999-888-7777');
    await page.selectOption('select[name="industry"]', 'cleaning');

    await page.click('button:has-text("Save Company Info")');

    await expect(page.locator('text=Company info updated successfully!')).toBeVisible();
    await expect(page.locator(`input[name="companyName"][value="${newCompanyName}"]`)).toBeVisible();
  });

  test('user can update notification preferences', async ({ page }) => {
    await page.click('button:has-text("Notifications")'); // Click notifications tab

    // Toggle a switch and save
    await page.locator('label:has-text("Marketing Emails") + button[role="switch"]').click(); // Click the switch
    await page.click('button:has-text("Save Preferences")');

    await expect(page.locator('text=Notification preferences updated!')).toBeVisible();
    // Verify the switch state if possible, or rely on the success message.
  });

  test('user can change password', async ({ page }) => {
    await page.click('button:has-text("Security")'); // Click security tab

    await page.fill('input[name="currentPassword"]', 'password123');
    await page.fill('input[name="newPassword"]', 'newsecurepassword');
    await page.fill('input[name="confirmNewPassword"]', 'newsecurepassword');

    await page.click('button:has-text("Update Password")');

    await expect(page.locator('text=Password changed successfully!')).toBeVisible();
    // In a real scenario, you might try logging in with the new password.
  });
});