import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'changeme123';
  const username = process.env.ADMIN_USERNAME || 'admin';
  const name = process.env.ADMIN_NAME || 'Admin User';

  console.log('Creating admin user...');
  console.log('Email:', email);
  console.log('Username:', username);

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      password: hashedPassword,
    },
    create: {
      email,
      username,
      password: hashedPassword,
      name,
    },
  });

  console.log('✓ Admin user created/updated successfully!');
  console.log('ID:', admin.id);
  console.log('Email:', admin.email);
  console.log('Username:', admin.username);
}

createAdmin()
  .catch((e) => {
    console.error('Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
