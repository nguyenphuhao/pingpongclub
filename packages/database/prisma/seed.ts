import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env từ root của monorepo (2 levels up từ prisma/)
config({ path: resolve(__dirname, '../../../.env') });
// Fallback: thử load từ packages/database/.env nếu có
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient, Gender, ProfileVisibility } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user for pingclub-admin (internal admin)
  const hashedPassword = await bcrypt.hash('1234', 10);
  const adminUser = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@pingclub.com',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created admin user (pingclub-admin):', adminUser.username);

  // Create admin user (for app users)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pingclub.com' },
    update: {},
    create: {
      email: 'admin@pingclub.com',
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
    where: { email: 'test@pingclub.com' },
    update: {},
    create: {
      email: 'test@pingclub.com',
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
    where: { email: 'user@pingclub.com' },
    update: {},
    create: {
      email: 'user@pingclub.com',
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
    where: { email: 'phone@pingclub.com' },
    update: {},
    create: {
      email: 'phone@pingclub.com',
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

  // ============================================
  // CREATE SAMPLE MEMBERS WITH DIVERSE RATINGS
  // ============================================
  console.log('\n🏸 Creating sample members with ratings...');

  const sampleMembers = [
    // Rank A* (> 2200)
    {
      email: 'nguyen.hao@pingclub.com',
      nickname: 'haong',
      displayName: 'Nguyễn Văn Hào',
      firstName: 'Hào',
      lastName: 'Nguyễn',
      gender: 'MALE' as Gender,
      dateOfBirth: new Date('1995-03-15'),
      ratingPoints: 2250,
      peakRating: 2280,
      totalMatches: 85,
      totalWins: 68,
      totalLosses: 17,
      winRate: 80.0,
      startedPlayingAt: new Date('2020-01-15'),
      tags: ['singles', 'doubles', 'offensive'],
      playStyle: 'Offensive',
      bio: 'Chơi ping pong 5 năm, đam mê tấn công',
      showPhone: false,
      showEmail: true,
    },
    {
      email: 'tran.minh@pingclub.com',
      nickname: 'minht',
      displayName: 'Trần Minh Tuấn',
      firstName: 'Tuấn',
      lastName: 'Trần',
      gender: 'MALE' as Gender,
      dateOfBirth: new Date('1992-07-20'),
      ratingPoints: 2210,
      peakRating: 2240,
      totalMatches: 102,
      totalWins: 75,
      totalLosses: 27,
      winRate: 73.5,
      startedPlayingAt: new Date('2019-03-10'),
      tags: ['singles', 'defensive', 'right-handed'],
      playStyle: 'Defensive',
      bio: 'Phòng thủ kiên cường',
    },
    // Rank A (2001-2200)
    {
      email: 'le.tuan@pingclub.com',
      nickname: 'tuanl',
      displayName: 'Lê Anh Tuấn',
      firstName: 'Tuấn',
      lastName: 'Lê',
      gender: 'MALE' as Gender,
      dateOfBirth: new Date('1998-11-05'),
      ratingPoints: 2150,
      peakRating: 2180,
      totalMatches: 65,
      totalWins: 48,
      totalLosses: 17,
      winRate: 73.8,
      startedPlayingAt: new Date('2021-06-01'),
      tags: ['singles', 'all-round'],
      playStyle: 'All-round',
    },
    {
      email: 'hoang.linh@pingclub.com',
      nickname: 'linhh',
      displayName: 'Hoàng Thu Linh',
      firstName: 'Linh',
      lastName: 'Hoàng',
      gender: 'FEMALE' as Gender,
      dateOfBirth: new Date('1997-04-12'),
      ratingPoints: 2050,
      peakRating: 2080,
      totalMatches: 58,
      totalWins: 40,
      totalLosses: 18,
      winRate: 69.0,
      startedPlayingAt: new Date('2020-09-15'),
      tags: ['singles', 'doubles', 'offensive'],
      playStyle: 'Offensive',
      bio: 'Nữ tay vợt hàng đầu CLB',
    },
    // Rank B (1801-2000)
    {
      email: 'pham.long@pingclub.com',
      nickname: 'longp',
      displayName: 'Phạm Thành Long',
      firstName: 'Long',
      lastName: 'Phạm',
      gender: 'MALE' as Gender,
      dateOfBirth: new Date('1994-09-08'),
      ratingPoints: 1950,
      peakRating: 1980,
      totalMatches: 72,
      totalWins: 48,
      totalLosses: 24,
      winRate: 66.7,
      startedPlayingAt: new Date('2021-01-20'),
      tags: ['doubles', 'left-handed'],
      playStyle: 'All-round',
    },
    {
      email: 'vu.dung@pingclub.com',
      nickname: 'dungv',
      displayName: 'Vũ Thị Dung',
      firstName: 'Dung',
      lastName: 'Vũ',
      gender: 'FEMALE' as Gender,
      dateOfBirth: new Date('1999-02-25'),
      ratingPoints: 1850,
      peakRating: 1900,
      totalMatches: 45,
      totalWins: 28,
      totalLosses: 17,
      winRate: 62.2,
      startedPlayingAt: new Date('2022-03-01'),
      tags: ['singles', 'defensive'],
      playStyle: 'Defensive',
    },
    // Rank C (1601-1800)
    {
      email: 'nguyen.duc@pingclub.com',
      nickname: 'ducn',
      displayName: 'Nguyễn Văn Đức',
      firstName: 'Đức',
      lastName: 'Nguyễn',
      gender: 'MALE' as Gender,
      dateOfBirth: new Date('2000-06-18'),
      ratingPoints: 1720,
      peakRating: 1750,
      totalMatches: 52,
      totalWins: 30,
      totalLosses: 22,
      winRate: 57.7,
      startedPlayingAt: new Date('2022-07-10'),
      tags: ['singles'],
      playStyle: 'Offensive',
    },
    {
      email: 'tran.ha@pingclub.com',
      nickname: 'hat',
      displayName: 'Trần Thu Hà',
      firstName: 'Hà',
      lastName: 'Trần',
      gender: 'FEMALE' as Gender,
      dateOfBirth: new Date('2001-12-03'),
      ratingPoints: 1650,
      peakRating: 1680,
      totalMatches: 38,
      totalWins: 20,
      totalLosses: 18,
      winRate: 52.6,
      startedPlayingAt: new Date('2023-01-15'),
      tags: ['singles', 'doubles'],
      playStyle: 'All-round',
    },
    // Rank D (1401-1600)
    {
      email: 'le.quang@pingclub.com',
      nickname: 'quangl',
      displayName: 'Lê Quang Minh',
      firstName: 'Minh',
      lastName: 'Lê',
      gender: 'MALE' as Gender,
      dateOfBirth: new Date('1996-08-22'),
      ratingPoints: 1520,
      peakRating: 1550,
      totalMatches: 42,
      totalWins: 22,
      totalLosses: 20,
      winRate: 52.4,
      startedPlayingAt: new Date('2023-04-01'),
      tags: ['doubles'],
      playStyle: 'Defensive',
    },
    // Rank E (1201-1400)
    {
      email: 'pham.anh@pingclub.com',
      nickname: 'anhp',
      displayName: 'Phạm Thu Anh',
      firstName: 'Anh',
      lastName: 'Phạm',
      gender: 'FEMALE' as Gender,
      dateOfBirth: new Date('2002-05-14'),
      ratingPoints: 1320,
      peakRating: 1350,
      totalMatches: 35,
      totalWins: 16,
      totalLosses: 19,
      winRate: 45.7,
      startedPlayingAt: new Date('2023-06-01'),
      tags: ['singles'],
      playStyle: 'All-round',
    },
    // Rank F (1001-1200)
    {
      email: 'nguyen.son@pingclub.com',
      nickname: 'sonn',
      displayName: 'Nguyễn Văn Sơn',
      firstName: 'Sơn',
      lastName: 'Nguyễn',
      gender: 'MALE' as Gender,
      dateOfBirth: new Date('2003-01-30'),
      ratingPoints: 1150,
      peakRating: 1180,
      totalMatches: 28,
      totalWins: 12,
      totalLosses: 16,
      winRate: 42.9,
      startedPlayingAt: new Date('2023-09-01'),
      tags: ['singles', 'right-handed'],
      playStyle: 'Offensive',
    },
    // Rank G (801-1000, playing <= 1 year)
    {
      email: 'tran.binh@pingclub.com',
      nickname: 'binht',
      displayName: 'Trần Văn Bình',
      firstName: 'Bình',
      lastName: 'Trần',
      gender: 'MALE' as Gender,
      dateOfBirth: new Date('2004-03-20'),
      ratingPoints: 920,
      peakRating: 950,
      totalMatches: 18,
      totalWins: 7,
      totalLosses: 11,
      winRate: 38.9,
      startedPlayingAt: new Date('2024-06-01'), // 0.5 years ago
      tags: ['singles'],
      playStyle: 'All-round',
    },
    // Rank H (<= 800, beginners)
    {
      email: 'le.mai@pingclub.com',
      nickname: 'mail',
      displayName: 'Lê Thu Mai',
      firstName: 'Mai',
      lastName: 'Lê',
      gender: 'FEMALE' as Gender,
      dateOfBirth: new Date('2005-07-08'),
      ratingPoints: 750,
      peakRating: 780,
      totalMatches: 12,
      totalWins: 3,
      totalLosses: 9,
      winRate: 25.0,
      startedPlayingAt: new Date('2024-09-01'),
      tags: ['singles'],
      playStyle: 'Defensive',
    },
    {
      email: 'hoang.nam@pingclub.com',
      nickname: 'namh',
      displayName: 'Hoàng Văn Nam',
      firstName: 'Nam',
      lastName: 'Hoàng',
      gender: 'MALE' as Gender,
      dateOfBirth: new Date('2006-11-15'),
      ratingPoints: 680,
      peakRating: 700,
      totalMatches: 8,
      totalWins: 2,
      totalLosses: 6,
      winRate: 25.0,
      startedPlayingAt: new Date('2024-10-01'),
      tags: ['singles'],
      playStyle: 'All-round',
      bio: 'Mới bắt đầu học ping pong',
    },
  ];

  let createdCount = 0;
  for (const memberData of sampleMembers) {
    try {
      await prisma.user.upsert({
        where: { email: memberData.email },
        update: {},
        create: {
          ...memberData,
          role: 'USER',
          status: 'ACTIVE',
          emailVerified: true,
          profileVisibility: 'PUBLIC' as ProfileVisibility,
        },
      });
      createdCount++;
    } catch (error) {
      console.error(`Failed to create member ${memberData.email}:`, error);
    }
  }

  console.log(`✅ Created ${createdCount}/${sampleMembers.length} sample members with diverse ratings`);
  console.log('   - Rank A*: 2 members');
  console.log('   - Rank A: 2 members');
  console.log('   - Rank B: 2 members');
  console.log('   - Rank C: 2 members');
  console.log('   - Rank D: 1 member');
  console.log('   - Rank E: 1 member');
  console.log('   - Rank F: 1 member');
  console.log('   - Rank G: 1 member');
  console.log('   - Rank H: 2 members');

  console.log('\n🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

