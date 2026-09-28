import { faker } from '@faker-js/faker';
import { prisma } from '../src/lib/prisma';
import {
  generateRestaurantId,
  generateMenuItemId,
  generateCustomerId,
  generateOrderId,
  generateOrderItemId,
} from '../src/lib/id';

const CUISINES = [
  'Italian',
  'Japanese',
  'Mexican',
  'American',
  'Indian',
  'Thai',
  'Mediterranean',
  'French',
  'Korean',
  'Vietnamese',
  'Chinese',
  'Greek',
];

const CITIES = [
  'New York',
  'San Francisco',
  'Chicago',
  'Austin',
  'Seattle',
  'Boston',
  'Denver',
  'Miami',
  'Los Angeles',
  'Portland',
];

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

const MENU_CATEGORIES = ['Appetizers', 'Mains', 'Sides', 'Desserts', 'Beverages'];

export async function seed() {
  console.log('🌱 Starting deterministic database seed...');

  // Set deterministic seed for 100% repeatability
  faker.seed(42);

  // 1. Transactional Clean-Sweep (Reverse FK order to ensure idempotency)
  console.log('🧹 Cleaning existing records...');
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.menuItem.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.restaurant.deleteMany(),
  ]);

  // 2. Generate 200 Restaurants
  console.log('🏪 Seeding 200 Restaurants...');
  const restaurantsData = [];
  const restaurantIds: string[] = [];

  for (let i = 0; i < 200; i++) {
    const id = generateRestaurantId();
    restaurantIds.push(id);
    const cuisine = CUISINES[i % CUISINES.length];
    const city = CITIES[i % CITIES.length];

    restaurantsData.push({
      id,
      name: `${faker.company.name()} ${cuisine === 'Italian' ? 'Trattoria' : cuisine === 'Japanese' ? 'Ramen Bar' : 'Kitchen'}`,
      cuisine,
      address: faker.location.streetAddress(),
      city,
      rating: parseFloat((faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 })).toFixed(1)),
      isOpen: faker.datatype.boolean({ probability: 0.85 }),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: new Date(),
    });
  }

  await prisma.restaurant.createMany({ data: restaurantsData });

  // 3. Generate 1,000 Menu Items (5 items per restaurant)
  console.log('🍽️ Seeding 1,000 Menu Items (5 per restaurant)...');
  const menuItemsData = [];
  const restaurantMenuItemsMap = new Map<string, Array<{ id: string; name: string; priceInCents: number }>>();

  for (const restId of restaurantIds) {
    const itemsForRestaurant: Array<{ id: string; name: string; priceInCents: number }> = [];

    for (let j = 0; j < 5; j++) {
      const id = generateMenuItemId();
      const category = MENU_CATEGORIES[j % MENU_CATEGORIES.length];
      const name = `${faker.food.dish()} (${category})`;
      const priceInCents = faker.number.int({ min: 450, max: 3800 });

      const itemRecord = {
        id,
        restaurantId: restId,
        name,
        description: faker.food.description(),
        category,
        priceInCents,
        isAvailable: faker.datatype.boolean({ probability: 0.9 }),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: new Date(),
      };

      menuItemsData.push(itemRecord);
      itemsForRestaurant.push({ id, name, priceInCents });
    }

    restaurantMenuItemsMap.set(restId, itemsForRestaurant);
  }

  // Insert menu items in batches
  await prisma.menuItem.createMany({ data: menuItemsData });

  // 4. Generate 300 Customers
  console.log('👥 Seeding 300 Customers...');
  const customersData = [];
  const customerIds: string[] = [];

  for (let i = 0; i < 300; i++) {
    const id = generateCustomerId();
    customerIds.push(id);

    customersData.push({
      id,
      name: faker.person.fullName(),
      email: `customer_${i + 1}_${faker.string.alphanumeric(6).toLowerCase()}@example.com`,
      phone: faker.phone.number({ style: 'national' }),
      deliveryAddress: `${faker.location.streetAddress()}, ${CITIES[i % CITIES.length]}`,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: new Date(),
    });
  }

  await prisma.customer.createMany({ data: customersData });

  // 5. Generate 600 Orders with OrderItems
  console.log('📦 Seeding 600 Orders with OrderItems...');
  const ordersData = [];
  const orderItemsData = [];

  for (let i = 0; i < 600; i++) {
    const orderId = generateOrderId();
    const customerId = customerIds[i % customerIds.length];
    const restaurantId = restaurantIds[i % restaurantIds.length];
    const availableItems = restaurantMenuItemsMap.get(restaurantId) || [];

    const numItems = faker.number.int({ min: 1, max: 3 });
    let orderTotalInCents = 0;

    for (let k = 0; k < numItems && k < availableItems.length; k++) {
      const selectedItem = availableItems[k];
      const quantity = faker.number.int({ min: 1, max: 3 });
      orderTotalInCents += selectedItem.priceInCents * quantity;

      orderItemsData.push({
        id: generateOrderItemId(),
        orderId,
        menuItemId: selectedItem.id,
        name: selectedItem.name,
        quantity,
        unitPriceInCents: selectedItem.priceInCents,
      });
    }

    const status = ORDER_STATUSES[i % ORDER_STATUSES.length];

    ordersData.push({
      id: orderId,
      customerId,
      restaurantId,
      status,
      totalAmountInCents: orderTotalInCents,
      deliveryAddress: faker.location.streetAddress(),
      notes: i % 4 === 0 ? faker.lorem.sentence() : null,
      createdAt: faker.date.recent({ days: 60 }),
      updatedAt: new Date(),
    });
  }

  await prisma.order.createMany({ data: ordersData });
  await prisma.orderItem.createMany({ data: orderItemsData });

  console.log('✅ Deterministic seeding complete:');
  console.log(`   - Restaurants: ${restaurantsData.length}`);
  console.log(`   - Menu Items:  ${menuItemsData.length}`);
  console.log(`   - Customers:   ${customersData.length}`);
  console.log(`   - Orders:      ${ordersData.length}`);
  console.log(`   - OrderItems:  ${orderItemsData.length}`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
