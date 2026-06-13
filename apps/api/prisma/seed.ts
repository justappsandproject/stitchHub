import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@stitchhub.com' },
    update: {},
    create: {
      email: 'admin@stitchhub.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log('Seeded super admin:', superAdmin.email);

  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'elegant-stitches' },
    update: {},
    create: {
      name: 'Elegant Stitches',
      slug: 'elegant-stitches',
      email: 'owner@elegantstitches.com',
      phone: '+2348012345678',
      address: '12 Fashion Street, Lagos',
      users: {
        create: {
          email: 'owner@elegantstitches.com',
          passwordHash: await bcrypt.hash('demo1234', 12),
          firstName: 'Ada',
          lastName: 'Okafor',
          phone: '+2348012345678',
          role: UserRole.TENANT_OWNER,
        },
      },
      measurementTemplates: {
        create: [
          {
            name: 'Men Standard',
            category: 'MEN',
            isDefault: true,
            fields: [
              { key: 'neck', label: 'Neck', unit: 'in' },
              { key: 'chest', label: 'Chest', unit: 'in' },
              { key: 'waist', label: 'Waist', unit: 'in' },
              { key: 'hip', label: 'Hip', unit: 'in' },
              { key: 'shoulder', label: 'Shoulder', unit: 'in' },
              { key: 'sleeve', label: 'Sleeve', unit: 'in' },
              { key: 'wrist', label: 'Wrist', unit: 'in' },
              { key: 'inseam', label: 'Inseam', unit: 'in' },
              { key: 'trouser_length', label: 'Trouser Length', unit: 'in' },
            ],
          },
        ],
      },
      styles: {
        create: [
          {
            name: 'Classic Agbada',
            category: 'Agbada',
            description: 'Traditional flowing agbada with intricate embroidery',
            basePrice: 85000,
          },
          {
            name: 'Senator Suit',
            category: 'Senator',
            description: 'Modern senator style with slim fit',
            basePrice: 45000,
          },
        ],
      },
    },
    include: { users: true },
  });

  const owner = demoTenant.users[0];

  const customer = await prisma.customer.upsert({
    where: {
      tenantId_phone: { tenantId: demoTenant.id, phone: '+2348098765432' },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      firstName: 'Chidi',
      lastName: 'Eze',
      phone: '+2348098765432',
      email: 'chidi@example.com',
      gender: 'MALE',
      isVip: true,
      tags: ['wedding', 'repeat'],
    },
  });

  const template = await prisma.measurementTemplate.findFirst({
    where: { tenantId: demoTenant.id },
  });

  const existingMeasurement = await prisma.measurement.findFirst({
    where: { customerId: customer.id },
  });

  if (template && !existingMeasurement) {
    await prisma.measurement.create({
      data: {
        tenantId: demoTenant.id,
        customerId: customer.id,
        templateId: template.id,
        values: {
          neck: 16,
          chest: 42,
          waist: 34,
          hip: 40,
          shoulder: 18,
          sleeve: 25,
          wrist: 7,
          inseam: 32,
          trouser_length: 42,
        },
        takenBy: owner.id,
      },
    });
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  await prisma.subscription.upsert({
    where: { tenantId: demoTenant.id },
    update: { plan: 'ENTERPRISE', status: 'ACTIVE' },
    create: {
      tenantId: demoTenant.id,
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      currentPeriodEnd: periodEnd,
    },
  });

  console.log('Seeded demo tenant:', demoTenant.name, '(Enterprise plan)');
  console.log('Demo owner login: owner@elegantstitches.com / demo1234');

  const customerUser = await prisma.user.upsert({
    where: { email: 'chidi@example.com' },
    update: {},
    create: {
      email: 'chidi@example.com',
      passwordHash: await bcrypt.hash('customer1234', 12),
      firstName: 'Chidi',
      lastName: 'Eze',
      phone: '+2348098765432',
      role: UserRole.CUSTOMER,
      tenantId: demoTenant.id,
    },
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: { userId: customerUser.id, email: 'chidi@example.com' },
  });

  const existingOrder = await prisma.order.findFirst({
    where: { tenantId: demoTenant.id, customerId: customer.id },
  });

  if (!existingOrder) {
    await prisma.order.create({
      data: {
        tenantId: demoTenant.id,
        customerId: customer.id,
        orderNumber: `ORD-${new Date().getFullYear()}-00001`,
        fabric: 'Premium Ankara',
        status: 'SEWING',
        priority: 'HIGH',
        totalAmount: 85000,
        depositAmount: 40000,
        balanceAmount: 45000,
        statusHistory: {
          create: { status: 'NEW', notes: 'Order created' },
        },
      },
    });
  }

  console.log('Demo customer login: chidi@example.com / customer1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
