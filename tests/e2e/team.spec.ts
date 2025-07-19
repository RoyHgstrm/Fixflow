import { test, expect } from '@playwright/test';

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure user is logged in as an admin/owner for team management tests
    // Authentication is handled by globalSetup and storageState
    await page.goto('/dashboard/team');
    await expect(page.locator('h1:has-text("Team Management")')).toBeVisible();
  });

  test('admin can invite a new team member', async ({ page }) => {
    await page.click('button:has-text("Invite Team Member")');
    await expect(page.locator('h2:has-text("Invite Team Member")')).toBeVisible();

    const memberEmail = `new.member.${Date.now()}@example.com`;
    await page.fill('input[name="email"]', memberEmail);
    await page.selectOption('select[name="role"]', 'EMPLOYEE');
    await page.click('button:has-text("Send Invitation")');

    await expect(page.locator('text=Invitation sent successfully!')).toBeVisible(); // Assuming success message
    await expect(page.locator(`text=${memberEmail}`)).toBeVisible(); // Verify member appears in the list
  });

  test('admin can change a team member\'s role', async ({ page }) => {
    // Pre-condition: A team member must exist.
    const memberEmail = 'employee@example.com'; // Assuming an existing employee

    // Find the row for the employee and click the options menu
    await page.locator(`text=${memberEmail}`).locator('xpath=ancestor::div[contains(@class, "flex items-center justify-between")]').locator('button[aria-label="Options"]').click(); // Adjust selector for options button

    await page.click('text=Edit Role'); // Click edit role option
    await page.selectOption('select[name="role"]', 'MANAGER'); // Change role to Manager
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Role updated successfully!')).toBeVisible();
    await expect(page.locator(`text=${memberEmail}`).locator('xpath=ancestor::div[contains(@class, "flex items-center justify-between")]').locator('text=MANAGER')).toBeVisible(); // Verify new role
  });

  test('admin can activate/deactivate a team member', async ({ page }) => {
    test.info().annotations.push({ type: 'todo', description: 'Implement activate/deactivate team member test.' });
  });

  test('user can filter team members by role and status', async ({ page }) => {
    await page.selectOption('select[name="role"]', 'MANAGER');
    await expect(page.locator('text=MANAGER')).toBeVisible(); // Verify filter applied
    await page.selectOption('select[name="role"]', 'all');

    await page.selectOption('select[name="status"]', 'inactive');
    await expect(page.locator('text=Inactive')).toBeVisible();
    await page.selectOption('select[name="status"]', 'all');
  });
});
