import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo admin account
  const hashedPassword = await bcrypt.hash('demo123456', 10);
  const demoAdmin = await prisma.admin.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo Admin',
    },
  });

  console.log('Created demo admin:', { username: demoAdmin.username, email: demoAdmin.email });

  // Create QR Generator Tool
  const qrTool = await prisma.tool.create({
    data: {
      adminId: demoAdmin.id,
      name: 'QR Code Generator',
      type: 'qr_generator',
      description: 'Generate custom QR codes for promotions and validation',
      active: true,
      config: JSON.stringify({
        qrAppearance: {
          width: 300,
          margin: 2,
          errorCorrectionLevel: 'H',
          darkColor: '#000000',
          lightColor: '#FFFFFF',
        },
        qrFormat: {
          prefix: 'QR',
          includeUserId: true,
          includeTimestamp: true,
          includeRandom: true,
          customFormat: '{PREFIX}-{USER_ID}-{TIMESTAMP}-{RANDOM}',
        },
        type: 'promotion',
        expiresInDays: 30,
        defaultMetadata: '{\n  "campaign": "demo_campaign"\n}',
      }),
    },
  });

  // Create Booking Tool
  const bookingTool = await prisma.tool.create({
    data: {
      adminId: demoAdmin.id,
      name: 'Appointment Booking',
      type: 'booking',
      description: 'Book appointments and manage time slots',
      active: true,
      config: JSON.stringify({
        slotDuration: 30,
        advanceBookingDays: 14,
        cancellationHours: 24,
      }),
    },
  });

  // Create Form Builder Tool
  const formTool = await prisma.tool.create({
    data: {
      adminId: demoAdmin.id,
      name: 'Form Builder',
      type: 'form_builder',
      description: 'Create custom forms for data collection',
      active: true,
      config: JSON.stringify({
        maxFields: 10,
        allowFileUploads: false,
      }),
    },
  });

  // Create Event RSVP Tool
  const eventTool = await prisma.tool.create({
    data: {
      adminId: demoAdmin.id,
      name: 'Event RSVP',
      type: 'event_rsvp',
      description: 'Manage event registrations and RSVPs',
      active: false, // Start inactive
      config: JSON.stringify({
        maxAttendees: 100,
        requireConfirmation: true,
      }),
    },
  });

  console.log('Created tools:', { qrTool, bookingTool, formTool, eventTool });

  // Create availability for booking tool (Monday to Friday, 9 AM - 5 PM)
  for (let day = 1; day <= 5; day++) {
    await prisma.availability.upsert({
      where: {
        id: `${bookingTool.id}-${day}`,
      },
      update: {},
      create: {
        id: `${bookingTool.id}-${day}`,
        toolId: bookingTool.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30,
        active: true,
      },
    });
  }

  console.log('Created availability slots for booking tool');
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
