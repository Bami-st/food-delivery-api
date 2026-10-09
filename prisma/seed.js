const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  const existingCustomers = await prisma.customer.count();
  if (existingCustomers > 0) {
    console.log(`Database already seeded. Skipping seed to prevent duplicates.`);
    return;
  }

  console.log('Starting to seed database...');
  const numRestaurants = 200;
  const numCustomers = 300;
  const numOrders = 500;
  const currency = 'USD';

  // 1. Seed Customers
  const customersData = Array.from({ length: numCustomers }).map(() => ({
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: `user${Math.random().toString(36).substring(7)}_${faker.internet.email()}`,
    phone: faker.phone.number(),
  }));
  await prisma.customer.createMany({ data: customersData });
  console.log(`Created ${numCustomers} customers.`);

  // 2. Seed Restaurants and Menu Items
  const restaurantsData = [];
  const menuItemsData = [];

  for (let i = 0; i < numRestaurants; i++) {
    const restaurantId = faker.string.uuid();
    restaurantsData.push({
      id: restaurantId,
      name: faker.company.name() + ' Restaurant',
      description: faker.lorem.sentence(),
      address: faker.location.streetAddress(),
    });

    const numItems = faker.number.int({ min: 5, max: 15 });
    for (let j = 0; j < numItems; j++) {
      menuItemsData.push({
        id: faker.string.uuid(),
        restaurantId,
        name: faker.food.dish(),
        description: faker.food.description(),
        priceCents: faker.number.int({ min: 500, max: 4000 }), // $5.00 to $40.00
        currency,
        isAvailable: faker.datatype.boolean(0.9), // 90% chance true
      });
    }
  }

  await prisma.restaurant.createMany({ data: restaurantsData });
  await prisma.menuItem.createMany({ data: menuItemsData });
  console.log(`Created ${numRestaurants} restaurants and ${menuItemsData.length} menu items.`);

  // 3. Seed Orders and Order Items
  const ordersData = [];
  const orderItemsData = [];
  
  // Group menu items by restaurant for quick access
  const itemsByRestaurant = menuItemsData.reduce((acc, item) => {
    if (!acc[item.restaurantId]) acc[item.restaurantId] = [];
    acc[item.restaurantId].push(item);
    return acc;
  }, {});

  for (let i = 0; i < numOrders; i++) {
    const orderId = faker.string.uuid();
    const customer = customersData[faker.number.int({ min: 0, max: numCustomers - 1 })];
    const restaurant = restaurantsData[faker.number.int({ min: 0, max: numRestaurants - 1 })];
    
    const availableItems = itemsByRestaurant[restaurant.id];
    if (!availableItems || availableItems.length === 0) continue;

    const numOrderItems = faker.number.int({ min: 1, max: 5 });
    let totalPriceCents = 0;

    for (let j = 0; j < numOrderItems; j++) {
      const menuItem = availableItems[faker.number.int({ min: 0, max: availableItems.length - 1 })];
      const quantity = faker.number.int({ min: 1, max: 3 });
      const priceAtOrderCents = menuItem.priceCents;
      
      totalPriceCents += priceAtOrderCents * quantity;

      orderItemsData.push({
        id: faker.string.uuid(),
        orderId,
        menuItemId: menuItem.id,
        quantity,
        priceAtOrderCents,
        currency
      });
    }

    ordersData.push({
      id: orderId,
      customerId: customer.id,
      restaurantId: restaurant.id,
      status: faker.helpers.arrayElement(['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']),
      totalPriceCents,
      currency
    });
  }

  // Due to SQLite limitations with foreign keys on large createMany batches, we can create orders in chunks or just sequentially.
  // We'll use Prisma's createMany which handles sqlite batches fine in recent versions.
  await prisma.order.createMany({ data: ordersData });
  await prisma.orderItem.createMany({ data: orderItemsData });
  
  console.log(`Created ${ordersData.length} orders and ${orderItemsData.length} order items.`);
  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
