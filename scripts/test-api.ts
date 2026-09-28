import { createApp } from '../src/app';
import { Server } from 'http';

async function runTests() {
  const app = createApp();
  let server: Server;
  const port = 3099;

  await new Promise<void>((resolve) => {
    server = app.listen(port, () => resolve());
  });

  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`🧪 Running API verification suite against ${baseUrl}...\n`);

  let allPassed = true;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      allPassed = false;
    }
  }

  try {
    // TEST 1: Limit 5000 is clamped to 100
    console.log('--- STAGE 4 TESTS: BAD INPUT & BOUNDARIES ---');
    const res1 = await fetch(`${baseUrl}/restaurants?limit=5000`);
    const json1 = await res1.json() as any;
    assert(
      res1.status === 200 && json1.meta.limit === 100 && json1.data.length === 100,
      'Limit 5000 clamped to 100 (got limit: ' + json1.meta?.limit + ', items: ' + json1.data?.length + ')'
    );

    // TEST 2: Negative offset returns 400
    const res2 = await fetch(`${baseUrl}/restaurants?offset=-10`);
    const json2 = await res2.json() as any;
    assert(
      res2.status === 400 && json2.error?.code === 'BAD_REQUEST',
      'Negative offset returns 400 Bad Request with error envelope'
    );

    // TEST 3: Unknown sort field returns 400
    const res3 = await fetch(`${baseUrl}/restaurants?sort=unknownField`);
    const json3 = await res3.json() as any;
    assert(
      res3.status === 400 && json3.error?.code === 'BAD_REQUEST',
      'Unknown sort field returns 400 Bad Request, not silent no-sort'
    );

    // TEST 4: Malformed identifier returns 400 / 404 (never 500)
    const res4 = await fetch(`${baseUrl}/restaurants/invalid-id-without-prefix`);
    const json4 = await res4.json() as any;
    assert(
      (res4.status === 400 || res4.status === 404) && json4.error?.code !== undefined,
      'Malformed ID returns 400/404 (status: ' + res4.status + ', code: ' + json4.error?.code + ')'
    );

    // TEST 5: POST with missing required field returns 422 naming the field
    const res5 = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 'cust_sample',
        // restaurantId missing
        deliveryAddress: '123 Main St',
        items: [{ menuItemId: 'menu_sample', quantity: 1 }],
      }),
    });
    const json5 = await res5.json() as any;
    const errorDetails = JSON.stringify(json5.error?.details || '');
    assert(
      res5.status === 422 && errorDetails.includes('restaurantId'),
      'POST with missing field returns 422 naming the missing field (restaurantId)'
    );

    // TEST 6: Nested endpoint GET /api/v1/restaurants/:id/menu
    console.log('\n--- STAGE 3 TESTS: REST CONVENTIONS & CRUD ---');
    const firstRest = json1.data[0];
    const resNested = await fetch(`${baseUrl}/restaurants/${firstRest.id}/menu?category=Mains&sort=priceInCents&order=asc`);
    const jsonNested = await resNested.json() as any;
    assert(
      resNested.status === 200 && Array.isArray(jsonNested.data) && jsonNested.meta.total !== undefined,
      'Nested menu endpoint returns { data, meta } envelope'
    );

    // TEST 7: Filtering and sorting on collections
    const resFilter = await fetch(`${baseUrl}/restaurants?cuisine=Italian&sort=rating&order=desc`);
    const jsonFilter = await resFilter.json() as any;
    const allItalian = jsonFilter.data.every((r: any) => r.cuisine === 'Italian');
    assert(
      resFilter.status === 200 && allItalian && jsonFilter.data.length > 0,
      'Filtering ?cuisine=Italian returns only Italian restaurants'
    );

    // TEST 8: Full CRUD on /api/v1/orders
    // 8a: CREATE (POST)
    const custRes = await (await fetch(`${baseUrl}/customers?limit=1`)).json() as any;
    const customer = custRes.data[0];
    const menuRes = await (await fetch(`${baseUrl}/restaurants/${firstRest.id}/menu?limit=2`)).json() as any;
    const menuItems = menuRes.data;

    const createRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: customer.id,
        restaurantId: firstRest.id,
        deliveryAddress: '742 Evergreen Terrace',
        notes: 'Ring doorbell twice',
        items: menuItems.map((m: any) => ({ menuItemId: m.id, quantity: 2 })),
      }),
    });
    const createJson = await createRes.json() as any;
    const createdOrderId = createJson.data?.id;
    assert(
      createRes.status === 201 && createdOrderId?.startsWith('ord_'),
      'POST /api/v1/orders creates order with 201 Created and prefixed ID'
    );

    // 8b: READ (GET)
    const getRes = await fetch(`${baseUrl}/orders/${createdOrderId}`);
    const getJson = await getRes.json() as any;
    assert(
      getRes.status === 200 && getJson.data?.id === createdOrderId && getJson.data.items.length === menuItems.length,
      'GET /api/v1/orders/:id retrieves created order with items'
    );

    // 8c: PARTIAL UPDATE (PATCH)
    const patchRes = await fetch(`${baseUrl}/orders/${createdOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CONFIRMED',
        notes: 'Leave at the front porch',
      }),
    });
    const patchJson = await patchRes.json() as any;
    assert(
      patchRes.status === 200 && patchJson.data?.status === 'CONFIRMED' && patchJson.data?.notes === 'Leave at the front porch',
      'PATCH /api/v1/orders/:id updates status and notes'
    );

    // 8d: DELETE
    const deleteRes = await fetch(`${baseUrl}/orders/${createdOrderId}`, {
      method: 'DELETE',
    });
    const deleteJson = await deleteRes.json() as any;
    assert(
      deleteRes.status === 200 && deleteJson.data?.deleted === true,
      'DELETE /api/v1/orders/:id deletes order'
    );

    // 8e: VERIFY DELETED
    const getDeletedRes = await fetch(`${baseUrl}/orders/${createdOrderId}`);
    assert(
      getDeletedRes.status === 404,
      'GET deleted order returns 404 Not Found'
    );

    console.log('\n--- STAGE 5 TESTS: RATE LIMITING ---');
    console.log('Sending burst of 105 requests to trigger rate limit (max 100/min)...');
    let hit429 = false;
    let retryAfterHeader: string | null = null;
    let rateLimitErrorBody: any = null;

    for (let i = 0; i < 110; i++) {
      const r = await fetch(`${baseUrl}/restaurants?limit=1`);
      if (r.status === 429) {
        hit429 = true;
        retryAfterHeader = r.headers.get('retry-after');
        rateLimitErrorBody = await r.json();
        break;
      }
    }

    assert(
      hit429 && retryAfterHeader !== null && rateLimitErrorBody?.error?.code === 'RATE_LIMIT_EXCEEDED',
      'Exceeding 100 requests triggers 429 with Retry-After header and RATE_LIMIT_EXCEEDED code'
    );

    console.log('\n========================================');
    if (allPassed) {
      console.log('🎉 ALL STAGE 3, 4, AND 5 TESTS PASSED!');
    } else {
      console.error('❌ SOME TESTS FAILED');
      process.exit(1);
    }
    console.log('========================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    server!.close();
  }
}

runTests();
