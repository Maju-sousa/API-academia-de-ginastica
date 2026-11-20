import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  {
    name: 'Administrador Starlife',
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@starlife.dev',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'starlife-admin-123',
    role: 'ADMIN',
  },
  {
    name: 'Trainer Starlife',
    email: process.env.SEED_TRAINER_EMAIL ?? 'trainer@starlife.dev',
    password: process.env.SEED_TRAINER_PASSWORD ?? 'starlife-trainer-123',
    role: 'TRAINER',
  },
  {
    name: 'Membro Starlife',
    email: process.env.SEED_MEMBER_EMAIL ?? 'member@starlife.dev',
    password: process.env.SEED_MEMBER_PASSWORD ?? 'starlife-member-123',
    role: 'MEMBER',
  },
];

for (const { password, ...user } of users) {
  await prisma.user.upsert({
    where: { email: user.email },
    update: {},
    create: {
      ...user,
      passwordHash: await bcrypt.hash(password, 12),
      ...(user.role === 'MEMBER' && { member: { create: {} } }),
    },
  });
  console.log(`seeded ${user.role.toLowerCase()} ${user.email}`);
}

await prisma.$disconnect();
