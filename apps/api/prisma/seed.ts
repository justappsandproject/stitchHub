import {
  Gender,
  OrderPriority,
  OrderStatus,
  PrismaClient,
  SubscriptionPlan,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_OWNER_PASSWORD = 'demo1234';
const DEFAULT_CUSTOMER_PASSWORD = 'customer1234';

const FIRST_NAMES = [
  'Chidi',
  'Amaka',
  'Tunde',
  'Fatima',
  'Emeka',
  'Ngozi',
  'Yusuf',
  'Blessing',
  'Kelechi',
  'Aisha',
  'Obinna',
  'Zainab',
  'Segun',
  'Chioma',
  'Ibrahim',
  'Adunni',
  'Biodun',
  'Halima',
  'Ifeanyi',
  'Ronke',
];

const LAST_NAMES = [
  'Eze',
  'Okonkwo',
  'Adeyemi',
  'Bello',
  'Okafor',
  'Nwosu',
  'Mohammed',
  'Adebayo',
  'Chukwu',
  'Yusuf',
  'Ogunleye',
  'Danjuma',
  'Ibrahim',
  'Obi',
  'Suleiman',
  'Akinwale',
  'Garba',
  'Ekwueme',
  'Lawal',
  'Ojo',
];

const MEASUREMENT_FIELDS = [
  { key: 'neck', label: 'Neck', unit: 'in' },
  { key: 'chest', label: 'Chest', unit: 'in' },
  { key: 'waist', label: 'Waist', unit: 'in' },
  { key: 'hip', label: 'Hip', unit: 'in' },
  { key: 'shoulder', label: 'Shoulder', unit: 'in' },
  { key: 'sleeve', label: 'Sleeve', unit: 'in' },
  { key: 'wrist', label: 'Wrist', unit: 'in' },
  { key: 'inseam', label: 'Inseam', unit: 'in' },
  { key: 'trouser_length', label: 'Trouser Length', unit: 'in' },
];

const DEFAULT_STYLES = [
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
  {
    name: 'Kaftan Set',
    category: 'Kaftan',
    description: 'Comfortable kaftan with matching trousers',
    basePrice: 35000,
  },
];

const ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.NEW,
  OrderStatus.MEASURED,
  OrderStatus.CUTTING,
  OrderStatus.SEWING,
  OrderStatus.FITTING,
  OrderStatus.READY,
  OrderStatus.DELIVERED,
];

type HouseSeed = {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  ownerFirstName: string;
  ownerLastName: string;
  /** When set, the first customer gets a login account. */
  linkedCustomerEmail?: string;
};

const FASHION_HOUSES: Record<SubscriptionPlan, HouseSeed[]> = {
  FREE: [],
  STARTER: [
    {
      name: 'Thread & Needle Atelier',
      slug: 'thread-needle-atelier',
      email: 'owner@threadneedle.demo',
      phone: '+2348010001001',
      address: '4 Ademola Street, Yaba, Lagos',
      ownerFirstName: 'Funke',
      ownerLastName: 'Adeola',
    },
    {
      name: 'Lagos Stitch Co.',
      slug: 'lagos-stitch-co',
      email: 'owner@lagosstitch.demo',
      phone: '+2348010001002',
      address: '18 Allen Avenue, Ikeja, Lagos',
      ownerFirstName: 'Samuel',
      ownerLastName: 'Etim',
    },
    {
      name: 'Ankara Dreams',
      slug: 'ankara-dreams',
      email: 'owner@ankaradreams.demo',
      phone: '+2348010001003',
      address: '7 Balogun Market Road, Lagos Island',
      ownerFirstName: 'Hauwa',
      ownerLastName: 'Sani',
    },
    {
      name: 'Quick Fit Tailors',
      slug: 'quick-fit-tailors',
      email: 'owner@quickfit.demo',
      phone: '+2348010001004',
      address: '22 Wuse Zone 4, Abuja',
      ownerFirstName: 'Patrick',
      ownerLastName: 'Udoh',
    },
    {
      name: 'Solo Seam Studio',
      slug: 'solo-seam-studio',
      email: 'owner@soloseam.demo',
      phone: '+2348010001005',
      address: '11 Ring Road, Ibadan',
      ownerFirstName: 'Grace',
      ownerLastName: 'Akpan',
    },
  ],
  PROFESSIONAL: [
    {
      name: 'Velvet & Vine',
      slug: 'velvet-and-vine',
      email: 'owner@velvetvine.demo',
      phone: '+2348020002001',
      address: '3 Admiralty Way, Lekki Phase 1, Lagos',
      ownerFirstName: 'Victoria',
      ownerLastName: 'Bassey',
    },
    {
      name: 'Royal Kente House',
      slug: 'royal-kente-house',
      email: 'owner@royalkente.demo',
      phone: '+2348020002002',
      address: '9 Kumasi Crescent, Wuse 2, Abuja',
      ownerFirstName: 'Kwame',
      ownerLastName: 'Mensah',
    },
    {
      name: 'Modern Agbada Co.',
      slug: 'modern-agbada-co',
      email: 'owner@modernagbada.demo',
      phone: '+2348020002003',
      address: '15 Awolowo Road, Ikoyi, Lagos',
      ownerFirstName: 'Damilola',
      ownerLastName: 'Fashola',
    },
    {
      name: 'Bella Couture NG',
      slug: 'bella-couture-ng',
      email: 'owner@bellacouture.demo',
      phone: '+2348020002004',
      address: '6 Aba Road, Port Harcourt',
      ownerFirstName: 'Isioma',
      ownerLastName: 'Duru',
    },
    {
      name: 'Heritage Tailors',
      slug: 'heritage-tailors',
      email: 'owner@heritage.demo',
      phone: '+2348020002005',
      address: '28 Ahmadu Bello Way, Kaduna',
      ownerFirstName: 'Musa',
      ownerLastName: 'Abubakar',
    },
  ],
  ENTERPRISE: [
    {
      name: 'Elegant Stitches',
      slug: 'elegant-stitches',
      email: 'owner@elegantstitches.com',
      phone: '+2348012345678',
      address: '12 Fashion Street, Lagos',
      ownerFirstName: 'Ada',
      ownerLastName: 'Okafor',
      linkedCustomerEmail: 'chidi@example.com',
    },
    {
      name: 'Golden Thread Fashion House',
      slug: 'golden-thread-house',
      email: 'owner@goldenthread.demo',
      phone: '+2348030003002',
      address: '1 Ozumba Mbadiwe Avenue, Victoria Island, Lagos',
      ownerFirstName: 'Olumide',
      ownerLastName: 'Bakare',
    },
    {
      name: 'Aso-Oke Palace',
      slug: 'aso-oke-palace',
      email: 'owner@asookepalace.demo',
      phone: '+2348030003003',
      address: '5 Broad Street, Lagos Island',
      ownerFirstName: 'Folake',
      ownerLastName: 'Ajayi',
    },
    {
      name: 'Diaspora Deluxe Atelier',
      slug: 'diaspora-deluxe',
      email: 'owner@diasporadeluxe.demo',
      phone: '+2348030003004',
      address: '14 Airport Road, Enugu',
      ownerFirstName: 'Chinedu',
      ownerLastName: 'Okoro',
    },
    {
      name: 'Première Mode Lagos',
      slug: 'premiere-mode-lagos',
      email: 'owner@premieremode.demo',
      phone: '+2348030003005',
      address: '33 Ozolua Street, Benin City',
      ownerFirstName: 'Efe',
      ownerLastName: 'Omoruyi',
    },
  ],
};

function customerPhone(plan: SubscriptionPlan, houseIndex: number, customerIndex: number) {
  const planCode = plan === SubscriptionPlan.STARTER ? '1' : plan === SubscriptionPlan.PROFESSIONAL ? '2' : '3';
  return `+23480${planCode}${String(houseIndex + 1).padStart(2, '0')}${String(customerIndex + 1).padStart(2, '0')}`;
}

function sampleMeasurementValues(seed: number) {
  return {
    neck: 14 + (seed % 4),
    chest: 38 + (seed % 8),
    waist: 30 + (seed % 8),
    hip: 36 + (seed % 8),
    shoulder: 16 + (seed % 4),
    sleeve: 22 + (seed % 6),
    wrist: 6 + (seed % 2),
    inseam: 30 + (seed % 4),
    trouser_length: 40 + (seed % 4),
  };
}

async function ensureTenantCatalog(tenantId: string) {
  let template = await prisma.measurementTemplate.findFirst({
    where: { tenantId, isDefault: true },
  });

  if (!template) {
    template = await prisma.measurementTemplate.create({
      data: {
        tenantId,
        name: 'Standard Measurements',
        category: 'MEN',
        isDefault: true,
        fields: MEASUREMENT_FIELDS,
      },
    });
  }

  for (const style of DEFAULT_STYLES) {
    const existingStyle = await prisma.style.findFirst({
      where: { tenantId, name: style.name },
    });
    if (!existingStyle) {
      await prisma.style.create({
        data: {
          tenantId,
          ...style,
        },
      });
    }
  }

  return template;
}

async function seedFashionHouse(
  plan: SubscriptionPlan,
  houseIndex: number,
  house: HouseSeed,
) {
  const ownerPasswordHash = await bcrypt.hash(DEFAULT_OWNER_PASSWORD, 12);
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const tenant = await prisma.tenant.upsert({
    where: { slug: house.slug },
    update: {
      name: house.name,
      email: house.email,
      phone: house.phone,
      address: house.address,
      isActive: true,
    },
    create: {
      name: house.name,
      slug: house.slug,
      email: house.email,
      phone: house.phone,
      address: house.address,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: house.email },
    update: {
      firstName: house.ownerFirstName,
      lastName: house.ownerLastName,
      phone: house.phone,
      role: UserRole.TENANT_OWNER,
      tenantId: tenant.id,
    },
    create: {
      email: house.email,
      passwordHash: ownerPasswordHash,
      firstName: house.ownerFirstName,
      lastName: house.ownerLastName,
      phone: house.phone,
      role: UserRole.TENANT_OWNER,
      tenantId: tenant.id,
    },
  });

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: { plan, status: 'ACTIVE', currentPeriodEnd: periodEnd },
    create: {
      tenantId: tenant.id,
      plan,
      status: 'ACTIVE',
      currentPeriodEnd: periodEnd,
    },
  });

  const template = await ensureTenantCatalog(tenant.id);
  const styles = await prisma.style.findMany({ where: { tenantId: tenant.id } });

  const customers = [];
  for (let i = 0; i < 10; i += 1) {
    const firstName = FIRST_NAMES[(houseIndex * 3 + i) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(houseIndex * 5 + i) % LAST_NAMES.length];
    const isLinkedCustomer = Boolean(house.linkedCustomerEmail && i === 0);
    const phone = isLinkedCustomer
      ? '+2348098765432'
      : customerPhone(plan, houseIndex, i);
    const gender = i % 3 === 0 ? Gender.FEMALE : i % 3 === 1 ? Gender.MALE : Gender.OTHER;
    const email = isLinkedCustomer
      ? house.linkedCustomerEmail
      : `customer${i + 1}@${house.slug}.demo`;

    const customer = await prisma.customer.upsert({
      where: {
        tenantId_phone: { tenantId: tenant.id, phone },
      },
      update: {
        firstName: isLinkedCustomer ? 'Chidi' : firstName,
        lastName: isLinkedCustomer ? 'Eze' : lastName,
        email,
        gender,
        isVip: i < 2,
        tags: i === 0 ? ['wedding', 'repeat'] : i % 4 === 0 ? ['corporate'] : [],
      },
      create: {
        tenantId: tenant.id,
        firstName: isLinkedCustomer ? 'Chidi' : firstName,
        lastName: isLinkedCustomer ? 'Eze' : lastName,
        phone,
        email,
        gender,
        isVip: i < 2,
        tags: i === 0 ? ['wedding', 'repeat'] : i % 4 === 0 ? ['corporate'] : [],
        address: `${10 + i} Customer Street, ${house.name.split(' ')[0]}`,
      },
    });

    if (isLinkedCustomer && house.linkedCustomerEmail) {
      const customerUser = await prisma.user.upsert({
        where: { email: house.linkedCustomerEmail },
        update: {
          tenantId: tenant.id,
          firstName: 'Chidi',
          lastName: 'Eze',
          phone,
          role: UserRole.CUSTOMER,
        },
        create: {
          email: house.linkedCustomerEmail,
          passwordHash: await bcrypt.hash(DEFAULT_CUSTOMER_PASSWORD, 12),
          firstName: 'Chidi',
          lastName: 'Eze',
          phone,
          role: UserRole.CUSTOMER,
          tenantId: tenant.id,
        },
      });

      if (customer.userId !== customerUser.id) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { userId: customerUser.id, email: house.linkedCustomerEmail },
        });
      }
    }

    const existingMeasurement = await prisma.measurement.findFirst({
      where: { customerId: customer.id },
    });

    if (!existingMeasurement) {
      await prisma.measurement.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          templateId: template.id,
          values: sampleMeasurementValues(houseIndex * 10 + i),
          takenBy: owner.id,
        },
      });
    }

    customers.push(customer);
  }

  for (let i = 0; i < 3; i += 1) {
    const customer = customers[i];
    const orderNumber = `ORD-${house.slug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
    const style = styles[i % styles.length];
    const totalAmount = Number(style?.basePrice ?? 45000);
    const depositAmount = Math.round(totalAmount * 0.4);
    const balanceAmount = totalAmount - depositAmount;

    const existingOrder = await prisma.order.findFirst({
      where: { tenantId: tenant.id, orderNumber },
    });

    if (!existingOrder) {
      await prisma.order.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          styleId: style?.id,
          orderNumber,
          fabric: ['Premium Ankara', 'Italian Wool', 'Silk Brocade'][i],
          status: ORDER_STATUSES[(houseIndex + i) % ORDER_STATUSES.length],
          priority: i === 0 ? OrderPriority.HIGH : OrderPriority.NORMAL,
          totalAmount,
          depositAmount,
          balanceAmount,
          statusHistory: {
            create: { status: OrderStatus.NEW, notes: 'Order created via seed' },
          },
        },
      });
    }
  }

  return { tenant, owner, customerCount: customers.length };
}

async function seedPortfolioAndDiscounts() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, slug: true },
  });

  for (const tenant of tenants) {
    const discountSeeds = [
      {
        code: 'WELCOME10',
        name: 'Welcome 10%',
        description: '10% off first orders for new clients',
        type: 'PERCENTAGE' as const,
        value: 10,
        applicability: 'FIRST_ORDER' as const,
      },
      {
        code: 'VIP5000',
        name: 'VIP ₦5,000 Off',
        description: 'Exclusive fixed discount for VIP customers',
        type: 'FIXED_AMOUNT' as const,
        value: 5000,
        applicability: 'VIP_ONLY' as const,
      },
      {
        code: 'SPEND50K',
        name: 'Big Spender 15%',
        description: '15% off orders above ₦50,000 (max ₦15,000)',
        type: 'PERCENTAGE' as const,
        value: 15,
        applicability: 'MINIMUM_SPEND' as const,
        minOrderAmount: 50000,
        maxDiscountCap: 15000,
      },
    ];

    for (const discount of discountSeeds) {
      await prisma.discount.upsert({
        where: {
          tenantId_code: { tenantId: tenant.id, code: discount.code },
        },
        update: { isActive: true },
        create: {
          tenantId: tenant.id,
          ...discount,
        },
      });
    }

    const manualItems = [
      {
        title: 'Royal Wedding Agbada',
        category: 'Agbada',
        fabric: 'Aso-Oke & Silk',
        description: 'Hand-embroidered ceremonial agbada with matching fila.',
      },
      {
        title: 'Executive Senator Suit',
        category: 'Senator',
        fabric: 'Italian Wool',
        description: 'Slim-fit senator with contrast collar detailing.',
      },
      {
        title: 'Ankara Cocktail Dress',
        category: 'Dress',
        fabric: 'Premium Ankara',
        description: 'Structured cocktail dress with custom pleating.',
      },
    ];

    for (const item of manualItems) {
      const existing = await prisma.portfolioItem.findFirst({
        where: { tenantId: tenant.id, title: item.title },
      });
      if (!existing) {
        await prisma.portfolioItem.create({
          data: {
            tenantId: tenant.id,
            ...item,
            source: 'MANUAL',
            isFeatured: item.title.includes('Royal'),
            isPublished: true,
            completedAt: new Date(),
          },
        });
      }
    }

    const deliveredOrders = await prisma.order.findMany({
      where: { tenantId: tenant.id, status: OrderStatus.DELIVERED },
      include: { style: true, customer: true },
      take: 5,
    });

    for (const order of deliveredOrders) {
      const existing = await prisma.portfolioItem.findUnique({
        where: { orderId: order.id },
      });
      if (!existing) {
        await prisma.portfolioItem.create({
          data: {
            tenantId: tenant.id,
            orderId: order.id,
            title: order.style?.name ?? `${order.fabric ?? 'Custom'} Look`,
            description: `Completed order ${order.orderNumber}`,
            category: order.style?.category ?? 'Custom',
            fabric: order.fabric ?? undefined,
            styleName: order.style?.name ?? undefined,
            source: 'ORDER',
            isPublished: true,
            completedAt: new Date(),
          },
        });
      }
    }
  }

  console.log(`Seeded portfolio & discounts for ${tenants.length} fashion houses`);
}

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

  let totalTenants = 0;
  let totalCustomers = 0;

  for (const plan of Object.values(SubscriptionPlan)) {
    const houses = FASHION_HOUSES[plan];
    console.log(`\n── ${plan} (${houses.length} fashion houses) ──`);

    for (let i = 0; i < houses.length; i += 1) {
      const { tenant, owner, customerCount } = await seedFashionHouse(plan, i, houses[i]);
      totalTenants += 1;
      totalCustomers += customerCount;
      console.log(
        `  ✓ ${tenant.name} — ${customerCount} customers — owner: ${owner.email} / ${DEFAULT_OWNER_PASSWORD}`,
      );
    }
  }

  await seedPortfolioAndDiscounts();

  console.log('\n── Summary ──');
  console.log(`Fashion houses: ${totalTenants}`);
  console.log(`Customers: ${totalCustomers}`);
  console.log('\nDemo logins:');
  console.log('  Super admin: admin@stitchhub.com / admin123');
  console.log('  Designer:    owner@elegantstitches.com / demo1234');
  console.log('  Customer:    chidi@example.com / customer1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
