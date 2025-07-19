import { PrismaClient } from '@prisma/client';
import { chromium, expect } from '@playwright/test';
import cuid from 'cuid';

const STORAGE_STATE_PATH = 'storageState.json';

async function globalSetup() {
  const prisma = new PrismaClient();

  try {
    // Clear existing test users to ensure a clean state
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'admin@example.com'],
        },
      },
    });

    // Create a regular test user (password will be managed by Supabase)
    await prisma.user.create({
      data: {
        id: cuid(),
        email: 'test@example.com',
        name: 'Test User',
        role: 'EMPLOYEE',
      },
    });

    // Create an admin test user
    await prisma.user.create({
      data: {
        id: cuid(),
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
      },
    });

    console.log('Playwright global setup: Test users created in Prisma.');

    // Perform UI login for a test user and save storage state
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle'); // Wait for the page to be fully loaded
    await page.waitForSelector('input[name="email"]', { timeout: 60000 }); // Increased timeout to 60 seconds
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123'); // Assuming a default password for Supabase test users
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard or a clear indication of successful login
    await page.waitForURL('http://localhost:3000/dashboard');
    await expect(page.locator('h1:has-text("Schedule")')).toBeVisible();

    await page.context().storageState({ path: STORAGE_STATE_PATH });
    await browser.close();

    console.log('Playwright global setup: User logged in and storage state saved.');
  } catch (error) {
    console.error('Error during Playwright global setup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;