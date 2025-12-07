import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user for dokifree-admin (internal admin)
  const hashedPassword = await bcrypt.hash('1234', 10);
  const adminUser = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@dokifree.com',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created admin user (dokifree-admin):', adminUser.username);

  // Create admin user (for app users)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dokifree.com' },
    update: {},
    create: {
      email: 'admin@dokifree.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('✅ Created admin user (app):', admin.email);

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@dokifree.com' },
    update: {},
    create: {
      email: 'test@dokifree.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create user with password (for password login testing)
  const passwordUserHash = await bcrypt.hash('password123', 10);
  const passwordUser = await prisma.user.upsert({
    where: { email: 'user@dokifree.com' },
    update: {},
    create: {
      email: 'user@dokifree.com',
      password: passwordUserHash,
      firstName: 'Password',
      lastName: 'User',
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
      provider: 'password',
    },
  });

  console.log('✅ Created user with password:', passwordUser.email, '(password: password123)');

  // Create user with phone and password
  const phoneUserHash = await bcrypt.hash('phone123', 10);
  const phoneUser = await prisma.user.upsert({
    where: { email: 'phone@dokifree.com' },
    update: {},
    create: {
      email: 'phone@dokifree.com',
      phone: '+84901234567',
      password: phoneUserHash,
      firstName: 'Phone',
      lastName: 'User',
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      provider: 'password',
    },
  });

  console.log('✅ Created user with phone:', phoneUser.phone, '(password: phone123)');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

