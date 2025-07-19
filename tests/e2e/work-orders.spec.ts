import { test, expect } from '@playwright/test';

test.describe('Work Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Authentication is handled by globalSetup and storageState
    await page.goto('/dashboard/work-orders');
    await expect(page.locator('h1:has-text("Work Order Management")')).toBeVisible();
  });

  test('user can create a new work order', async ({ page }) => {
    await page.click('button:has-text("New Work Order")'); // Assuming button text
    await expect(page.locator('h2:has-text("Create New Work Order")')).toBeVisible();

    const workOrderTitle = `WO ${Date.now()}`;
    await page.fill('input[name="title"]', workOrderTitle);
    await page.fill('textarea[name="description"]', 'This is a test work order description.');
    await page.fill('input[name="amount"]', '150.00');

    // Select a customer (assuming a dropdown or search input)
    // This requires a pre-existing customer. For robust tests, seed a customer.
    await page.locator('label:has-text("Customer") + div button').click(); // Click select trigger
    await page.locator('div[role="option"]:has-text("Test Customer")').click(); // Select a known customer

    await page.selectOption('select[name="priority"]', 'HIGH');
    await page.selectOption('select[name="status"]', 'PENDING');

    // Schedule date (assuming a date picker)
    await page.locator('input[name="scheduledDate"]').click();
    await page.locator('.react-day-picker-day--today').click(); // Select today's date

    await page.click('button:has-text("Create Work Order")');

    await expect(page.locator('text=Work order created successfully!')).toBeVisible();
    await expect(page.locator(`text=${workOrderTitle}`)).toBeVisible();
  });

  test('user can view work order details', async ({ page }) => {
    // Pre-condition: A work order must exist.
    // For this example, we'll assume one exists or create one via API.
    const workOrderTitle = 'Existing Test Work Order'; // Use a known work order title

    await page.locator(`text=${workOrderTitle}`).first().click();
    await expect(page).toHaveURL(/\/dashboard\/work-orders\/.+/);
    await expect(page.locator(`h1:has-text("${workOrderTitle}")`)).toBeVisible();
    await expect(page.locator('text=Work Order Details')).toBeVisible();
    await expect(page.locator('text=Customer Information')).toBeVisible();
  });

  test('user can edit work order status', async ({ page }) => {
    // Pre-condition: Navigate to a work order detail page
    // For this example, we'll assume one exists or create one via API.
    const workOrderTitle = 'Existing Test Work Order';
    await page.locator(`text=${workOrderTitle}`).first().click();
    await expect(page).toHaveURL(/\/dashboard\/work-orders\/.+/);

    await page.click('button:has-text("Edit")'); // Assuming an edit button

    await page.selectOption('select[name="status"]', 'IN_PROGRESS');
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Work order updated successfully!')).toBeVisible();
    await expect(page.locator('text=IN PROGRESS')).toBeVisible(); // Verify status change
  });

  test('user can assign work order to team member', async ({ page }) => {
    test.info().annotations.push({ type: 'todo', description: 'Implement work order assignment test.' });
  });
});