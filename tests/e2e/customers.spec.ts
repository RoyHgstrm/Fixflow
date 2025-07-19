import { test, expect } from '@playwright/test';

test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure user is logged in and on the customers page
    // Authentication is handled by globalSetup and storageState
    await page.goto('/dashboard/customers');
    await expect(page.locator('h1:has-text("Customer Management")')).toBeVisible();
  });

  test('user can create a new customer', async ({ page }) => {
    await page.click('button:has-text("Create Customer")'); // Assuming button text
    await expect(page.locator('h2:has-text("Create New Customer")')).toBeVisible(); // Assuming dialog title

    const customerName = `New Customer ${Date.now()}`;
    const customerEmail = `new.customer.${Date.now()}@example.com`;

    await page.fill('input[name="name"]', customerName);
    await page.fill('input[name="email"]', customerEmail);
    await page.locator('#customer-type-select').click(); // Click the select trigger
    await page.locator('div[role="option"]:has-text("Residential")').click(); // Select Residential
    await page.fill('input[name="phone"]', '123-456-7890');
    await page.fill('input[name="address"]', '123 Main St');
    await page.fill('input[name="city"]', 'Anytown');
    await page.fill('input[name="zipCode"]', '12345');
    await page.fill('textarea[name="notes"]', 'Important notes for this customer.');

    await page.click('button:has-text("Save Customer")'); // Assuming save button text

    // Verify success message or redirection
    await expect(page.locator('text=Customer created successfully!')).toBeVisible(); // Assuming a toast/success message
    await expect(page.locator(`text=${customerName}`)).toBeVisible(); // Verify customer appears in the list
  });

  test('user can view customer details', async ({ page }) => {
    // Pre-condition: A customer must exist. Create one if necessary for the test.
    // For this example, we'll assume a customer named "Test Customer" exists from previous tests or seeding.
    const customerName = 'Test Customer'; // Use a known customer name

    // Click on the customer in the list to view details
    await page.locator(`text=${customerName}`).first().click(); // Click the first occurrence

    // Verify redirection to customer detail page
    await expect(page).toHaveURL(/\/dashboard\/customers\/.+/);
    await expect(page.locator(`h1:has-text("${customerName}")`)).toBeVisible();
    await expect(page.locator('text=Basic Information')).toBeVisible();
    await expect(page.locator('text=Address')).toBeVisible();
    await expect(page.locator('text=Work Orders')).toBeVisible();
  });

  test('user can edit customer details', async ({ page }) => {
    // Pre-condition: Navigate to a customer detail page
    // For this example, we'll create a customer first
    await page.click('button:has-text("Create Customer")');
    const customerName = `Edit Test ${Date.now()}`;
    const customerEmail = `edit.test.${Date.now()}@example.com`;
    await page.fill('input[name="name"]', customerName);
    await page.fill('input[name="email"]', customerEmail);
    await page.locator('#customer-type-select').click(); // Click the select trigger
    await page.locator('div[role="option"]:has-text("Residential")').click(); // Select Residential
    await page.click('button:has-text("Save Customer")');
    await expect(page.locator('text=Customer created successfully!')).toBeVisible();
    await page.locator(`text=${customerName}`).first().click();
    await expect(page).toHaveURL(/\/dashboard\/customers\/.+/);

    await page.click('button:has-text("Edit")'); // Assuming an edit button

    const updatedPhone = '987-654-3210';
    await page.fill('input[name="phone"]', updatedPhone);
    await page.click('button:has-text("Save Changes")'); // Assuming save changes button

    await expect(page.locator('text=Customer updated successfully!')).toBeVisible();
    await expect(page.locator(`text=${updatedPhone}`)).toBeVisible(); // Verify updated phone number
  });

  test('user can delete a customer (admin role)', async ({ page }) => {
    // This test requires an admin user and careful data cleanup.
    // For simplicity, I'll outline the steps. In a real scenario, you'd create a disposable customer.
    // 1. Create a new customer for deletion.
    // 2. Navigate to that customer's detail page.
    // 3. Click the delete button (assuming it exists and is accessible by admin).
    // 4. Confirm deletion in a dialog.
    // 5. Verify customer is no longer in the list and redirected to customers page.
    test.info().annotations.push({ type: 'todo', description: 'Implement customer deletion test with admin role and proper cleanup.' });
  });
});