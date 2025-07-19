import { PrismaClient } from '@prisma/client';
import fs from 'fs';

async function globalTeardown() {
  const prisma = new PrismaClient();

  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'admin@example.com'],
        },
      },
    });
    console.log('Playwright global teardown complete: Test users deleted.');

    // Remove the storageState.json file
    if (fs.existsSync('storageState.json')) {
      fs.unlinkSync('storageState.json');
      console.log('storageState.json removed.');
    }
  } catch (error) {
    console.error('Error during Playwright global teardown:', error);
  } finally {
    await prisma.$disconnect();
  }
}

export default globalTeardown;