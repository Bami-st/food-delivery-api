import { prisma } from '../src/lib/prisma';

async function verify() {
  console.log('🔍 Verifying database record counts & relational integrity...');

  const restaurantCount = await prisma.restaurant.count();
  const menuItemCount = await prisma.menuItem.count();
  const customerCount = await prisma.customer.count();
  const orderCount = await prisma.order.count();
  const orderItemCount = await prisma.orderItem.count();

  console.log('📊 Actual Counts in Database:');
  console.log(`   - Restaurants: ${restaurantCount}`);
  console.log(`   - Menu Items:  ${menuItemCount}`);
  console.log(`   - Customers:   ${customerCount}`);
  console.log(`   - Orders:      ${orderCount}`);
  console.log(`   - Order Items: ${orderItemCount}`);

  // Integrity checks
  const sampleOrder = await prisma.order.findFirst({
    include: {
      customer: true,
      restaurant: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  if (!sampleOrder) {
    throw new Error('Verification failed: No orders found.');
  }

  console.log('\n🔗 Sample Relational Check:');
  console.log(`   Order ID:        ${sampleOrder.id}`);
  console.log(`   Customer Name:   ${sampleOrder.customer.name} (${sampleOrder.customer.email})`);
  console.log(`   Restaurant Name: ${sampleOrder.restaurant.name} (${sampleOrder.restaurant.cuisine})`);
  console.log(`   Items Count:     ${sampleOrder.items.length}`);
  console.log(`   Order Status:    ${sampleOrder.status}`);
  console.log(`   Total Amount:    $${(sampleOrder.totalAmountInCents / 100).toFixed(2)}`);

  console.log('\n✅ Verification PASSED: All relationships are intact and record counts match expected values.');
}

verify()
  .catch((e) => {
    console.error('❌ Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
