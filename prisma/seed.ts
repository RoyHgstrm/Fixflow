import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.user.deleteMany();

  // Create a user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@fixflow.com',
      password: hashedPassword,
      phone: '+1-555-0001',
      isActive: true,
    },
  });

  console.log('👥 Created admin user');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 