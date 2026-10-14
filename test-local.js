/**
 * test-local.js — Integration tests for fix-empty-orders PR review feedback.
 *
 * Prerequisites:
 *   1. Start the server:  node index.js
 *   2. Seed the database: npm run seed  (if not already done)
 *   3. In a separate terminal run: node test-local.js
 *
 * The script targets localhost:3000 by default.
 * Override: TEST_URL=http://localhost:3000/api/v1 node test-local.js
 *
 * Exit code 0 = all tests pass.  Non-zero = at least one failure.
 */

const http = require('http');
const https = require('https');

const BASE = process.env.TEST_URL || 'http://localhost:3000/api/v1';

// ---------------------------------------------------------------------------
// Minimal HTTP helper
// ---------------------------------------------------------------------------
function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE + path);
        const lib = url.protocol === 'https:' ? https : http;
        const opts = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        const req = lib.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                let json;
                try { json = JSON.parse(data); } catch (_) { json = null; }
                resolve({ status: res.statusCode, body: json, raw: data });
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function assert(label, condition, extra = '') {
    if (condition) {
        console.log(`  ✓  ${label}`);
        passed++;
    } else {
        console.error(`  ✗  ${label}${extra ? '  →  ' + extra : ''}`);
        failed++;
    }
}

async function runTests() {
    console.log(`\n========================================`);
    console.log(`  Food-Delivery API — Integration Tests`);
    console.log(`  Target: ${BASE}`);
    console.log(`========================================\n`);

    // ------------------------------------------------------------------
    // 1. Pagination — paginated response shape
    // ------------------------------------------------------------------
    console.log('── Pagination ──');
    {
        const r = await request('GET', '/restaurants?limit=2&offset=0');
        assert('GET /restaurants?limit=2 → 200',            r.status === 200);
        assert('Response has data array',                   Array.isArray(r.body?.data));
        assert('Response has meta.totalCount',              typeof r.body?.meta?.totalCount === 'number');
        assert('meta.limit equals requested limit (2)',     r.body?.meta?.limit === 2);
        assert('meta.offset equals requested offset (0)',   r.body?.meta?.offset === 0);
        assert('data.length <= 2',                          r.body?.data?.length <= 2);
    }

    // ------------------------------------------------------------------
    // 2. Pagination — limit clamping (>100 clamped to 100)
    // ------------------------------------------------------------------
    {
        const r = await request('GET', '/restaurants?limit=5000');
        assert('GET /restaurants?limit=5000 → 200 (clamped)', r.status === 200);
        assert('meta.limit clamped to 100',                   r.body?.meta?.limit === 100);
    }

    // ------------------------------------------------------------------
    // 3. Pagination — negative limit → 400 (NEW behaviour from this PR)
    // ------------------------------------------------------------------
    console.log('\n── Negative limit rejection (PR fix) ──');
    {
        const r = await request('GET', '/restaurants?limit=-1');
        assert('GET /restaurants?limit=-1 → 400',         r.status === 400,
               `got ${r.status}: ${r.raw}`);
        assert('Error code is INVALID_PAGINATION',         r.body?.error?.code === 'INVALID_PAGINATION',
               `got ${r.body?.error?.code}`);
    }
    {
        const r = await request('GET', '/menu-items?limit=-5');
        assert('GET /menu-items?limit=-5 → 400',           r.status === 400);
    }
    {
        const r = await request('GET', '/customers?limit=-1');
        assert('GET /customers?limit=-1 → 400',            r.status === 400);
    }
    {
        const r = await request('GET', '/orders?limit=-1');
        assert('GET /orders?limit=-1 → 400',               r.status === 400);
    }

    // ------------------------------------------------------------------
    // 4. Pagination — negative offset → 400 (pre-existing behaviour)
    // ------------------------------------------------------------------
    console.log('\n── Negative offset rejection ──');
    {
        const r = await request('GET', '/restaurants?offset=-5');
        assert('GET /restaurants?offset=-5 → 400',        r.status === 400,
               `got ${r.status}: ${r.raw}`);
        assert('Error code is INVALID_PAGINATION',         r.body?.error?.code === 'INVALID_PAGINATION');
    }

    // ------------------------------------------------------------------
    // 5. Order creation — empty items array → 422 (existing fix)
    // ------------------------------------------------------------------
    console.log('\n── Empty order rejection ──');
    {
        // We need a valid customerId and restaurantId to reach the items check
        const rList = await request('GET', '/restaurants?limit=1');
        const cList = await request('GET', '/customers?limit=1');

        if (!rList.body?.data?.length || !cList.body?.data?.length) {
            console.warn('  ⚠  No seed data — skipping order lifecycle tests. Run: npm run seed');
        } else {
            const rId = rList.body.data[0].id;
            const cId = cList.body.data[0].id;

            // Empty items array
            const r = await request('POST', '/orders', {
                customerId: cId,
                restaurantId: rId,
                items: []
            });
            assert('POST /orders with items:[] → 422',        r.status === 422,
                   `got ${r.status}: ${r.raw}`);
            assert('Error code is UNPROCESSABLE_ENTITY',       r.body?.error?.code === 'UNPROCESSABLE_ENTITY');

            // Missing items field entirely
            const r2 = await request('POST', '/orders', {
                customerId: cId,
                restaurantId: rId
            });
            assert('POST /orders with no items field → 422',  r2.status === 422);

            // ------------------------------------------------------------------
            // 6. Duplicate menuItemId → 422 (NEW behaviour from this PR)
            // ------------------------------------------------------------------
            console.log('\n── Duplicate menuItemId rejection (PR fix) ──');
            const mList = await request('GET', `/restaurants/${rId}/menu-items?limit=1`);
            if (!mList.body?.data?.length) {
                console.warn('  ⚠  No menu items for first restaurant — skipping duplicate test.');
            } else {
                const mId = mList.body.data[0].id;
                const r3 = await request('POST', '/orders', {
                    customerId: cId,
                    restaurantId: rId,
                    items: [
                        { menuItemId: mId, quantity: 1 },
                        { menuItemId: mId, quantity: 2 }   // duplicate!
                    ]
                });
                assert('POST /orders with duplicate menuItemId → 422',
                       r3.status === 422, `got ${r3.status}: ${r3.raw}`);
                assert('Error code is DUPLICATE_ITEM',
                       r3.body?.error?.code === 'DUPLICATE_ITEM',
                       `got ${r3.body?.error?.code}`);

                // ------------------------------------------------------------------
                // 7. Valid order creation → 201
                // ------------------------------------------------------------------
                console.log('\n── Valid order creation ──');
                const r4 = await request('POST', '/orders', {
                    customerId: cId,
                    restaurantId: rId,
                    items: [{ menuItemId: mId, quantity: 2 }]
                });
                assert('POST /orders (valid) → 201',          r4.status === 201,
                       `got ${r4.status}: ${r4.raw}`);
                assert('Response has data.id',                typeof r4.body?.data?.id === 'string');
                assert('Response has data.orderItems array',  Array.isArray(r4.body?.data?.orderItems));
                assert('Order status is pending',             r4.body?.data?.status === 'pending');

                if (r4.body?.data?.id) {
                    const oId = r4.body.data.id;

                    // ------------------------------------------------------------------
                    // 8. PATCH status update → 200
                    // ------------------------------------------------------------------
                    console.log('\n── Order status update ──');
                    const r5 = await request('PATCH', `/orders/${oId}`, { status: 'accepted' });
                    assert('PATCH /orders/:id (status=accepted) → 200',
                           r5.status === 200, `got ${r5.status}: ${r5.raw}`);
                    assert('Updated status is accepted',       r5.body?.data?.status === 'accepted');

                    // ------------------------------------------------------------------
                    // 9. DELETE non-pending order → 422
                    // ------------------------------------------------------------------
                    console.log('\n── Delete non-pending order rejection ──');
                    const r6 = await request('DELETE', `/orders/${oId}`);
                    assert('DELETE /orders/:id (accepted order) → 422',
                           r6.status === 422, `got ${r6.status}: ${r6.raw}`);
                    assert('Error code is UNPROCESSABLE_ENTITY',
                           r6.body?.error?.code === 'UNPROCESSABLE_ENTITY');

                    // Cleanup: if we could cancel the order, do so. But since DELETE is
                    // blocked for non-pending, we can't delete it from here. That's fine —
                    // we're just running against the test/local DB.
                }
            }
        }
    }

    // ------------------------------------------------------------------
    // 10. Invalid sort field → 400
    // ------------------------------------------------------------------
    console.log('\n── Invalid query parameter rejection ──');
    {
        const r = await request('GET', '/restaurants?sort=unknown');
        assert('GET /restaurants?sort=unknown → 400', r.status === 400);
    }

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------
    console.log(`\n========================================`);
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);
    if (failed > 0) process.exit(1);
}

runTests().catch(err => {
    console.error('Unexpected error running tests:', err);
    process.exit(1);
});
