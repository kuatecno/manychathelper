import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create helpers
  const helper1 = await prisma.helper.create({
    data: {
      name: 'John Helper',
      email: 'helper1@example.com',
      phone: '+1234567890',
      active: true,
    },
  });

  const helper2 = await prisma.helper.create({
    data: {
      name: 'Jane Helper',
      email: 'helper2@example.com',
      phone: '+0987654321',
      active: true,
    },
  });

  console.log('Created helpers:', { helper1, helper2 });

  // Create availability for helper1 (Monday to Friday, 9 AM - 5 PM)
  for (let day = 1; day <= 5; day++) {
    await prisma.availability.upsert({
      where: {
        id: `${helper1.id}-${day}`,
      },
      update: {},
      create: {
        id: `${helper1.id}-${day}`,
        helperId: helper1.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        active: true,
      },
    });
  }

  // Create availability for helper2 (Monday to Friday, 10 AM - 6 PM)
  for (let day = 1; day <= 5; day++) {
    await prisma.availability.upsert({
      where: {
        id: `${helper2.id}-${day}`,
      },
      update: {},
      create: {
        id: `${helper2.id}-${day}`,
        helperId: helper2.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '18:00',
        slotDuration: 60,
        active: true,
      },
    });
  }

  console.log('Created availability slots');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
