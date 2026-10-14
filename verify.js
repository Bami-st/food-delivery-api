const fs = require('fs');
const { execSync } = require('child_process');

// Default to localhost so the script is safe to run without any extra flags.
// Override with:  VERIFY_URL=https://food-delivery-api-1-7iip.onrender.com/api/v1 node verify.js
const url = process.env.VERIFY_URL || 'http://localhost:3000/api/v1';

// Mutating tests (order creation/update/delete) and the rate-limit spam loop
// must be opted into explicitly when running against a remote/production host,
// because they write real data and consume rate-limit quota for other users.
// Set ALLOW_REMOTE=true to enable them when VERIFY_URL points to a remote server.
const parsedUrl = new URL(url);
const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname);
const isRemote = !isLocalhost;
const allowRemote = process.env.ALLOW_REMOTE === 'true';
const skipMutations = isRemote && !allowRemote;

if (skipMutations) {
    console.warn(
        '[verify] Running against a remote URL without ALLOW_REMOTE=true.\n' +
        '         Mutation tests (order create/update/delete) and rate-limit\n' +
        '         spam will be skipped to protect production data.\n' +
        '         Set ALLOW_REMOTE=true to run the full suite.'
    );
}

function run(cmd, desc) {
    console.log(`\n--- ${desc} ---`);
    console.log(`Command: ${cmd}`);
    let output = '';
    try {
        output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    } catch (e) {
        output = e.stdout + '\n' + e.stderr;
    }
    const cleanOutput = output.replace(/\r\n/g, '\n').trim();
    console.log(cleanOutput.substring(0, 500) + (cleanOutput.length > 500 ? '\n...[truncated]' : ''));
    return `### ${desc}\n\n\`\`\`bash\n$ ${cmd}\n${cleanOutput}\n\`\`\`\n\n`;
}

async function main() {
    let md = '# API Verification Evidence\n\n';
    md += `> **Target:** \`${url}\`\n`;
    if (skipMutations) {
        md += '> **Note:** Mutation and rate-limit tests were skipped (remote host, ALLOW_REMOTE not set).\n';
    }
    md += '\n';

    // 1. Paginated Response
    md += run(`curl -i -s -g "${url}/restaurants?limit=2&offset=0"`, 'Paginated Response');

    // 2. Limit Clamping (>100 → clamped to 100)
    md += run(`curl -i -s -g "${url}/restaurants?limit=5000"`, 'Maximum Limit Clamping (limit>100 clamped to 100)');

    // 3. Negative Limit Rejection (now returns 400)
    md += run(`curl -i -s -g "${url}/restaurants?limit=-1"`, 'Negative Limit Rejection (400 Bad Request)');

    // 4. Negative Offset Rejection
    md += run(`curl -i -s -g "${url}/restaurants?offset=-5"`, 'Invalid Offset Rejection (400 Bad Request)');

    // 5. Invalid sort field
    md += run(`curl -i -s -g "${url}/restaurants?sort=unknown"`, 'Invalid Sort Field');

    if (skipMutations) {
        // Append a clear note instead of silently omitting the sections
        md += '### Order Lifecycle Tests\n\n> Skipped — set `ALLOW_REMOTE=true` to run against a remote host.\n\n';
        md += '### Rate Limit Rejection and Retry-After\n\n> Skipped — set `ALLOW_REMOTE=true` to run against a remote host.\n\n';
    } else {
        // 6. Get a customer and restaurant for order testing
        const restRes = JSON.parse(execSync(`curl -s "${url}/restaurants?limit=1"`, { encoding: 'utf8' }));
        const custRes = JSON.parse(execSync(`curl -s "${url}/customers?limit=1"`, { encoding: 'utf8' }));

        if (restRes.data.length && custRes.data.length) {
            const rId = restRes.data[0].id;
            const cId = custRes.data[0].id;
            const menuRes = JSON.parse(execSync(`curl -s "${url}/restaurants/${rId}/menu-items?limit=2"`, { encoding: 'utf8' }));

            if (menuRes.data.length) {
                const mId = menuRes.data[0].id;

                // 7. Empty-order rejection
                const emptyPayload = JSON.stringify({ customerId: cId, restaurantId: rId, items: [] });
                fs.writeFileSync('payload.json', emptyPayload);
                md += run(`curl -i -s -X POST -H "Content-Type: application/json" -d @payload.json "${url}/orders"`, 'Empty Order Rejection (422)');

                // 8. Duplicate menuItemId rejection
                const dupPayload = JSON.stringify({
                    customerId: cId,
                    restaurantId: rId,
                    items: [{ menuItemId: mId, quantity: 1 }, { menuItemId: mId, quantity: 2 }]
                });
                fs.writeFileSync('payload.json', dupPayload);
                md += run(`curl -i -s -X POST -H "Content-Type: application/json" -d @payload.json "${url}/orders"`, 'Duplicate menuItemId Rejection (422)');

                // 9. Valid Order Creation
                const validPayload = JSON.stringify({
                    customerId: cId,
                    restaurantId: rId,
                    items: [{ menuItemId: mId, quantity: 2 }]
                });
                fs.writeFileSync('payload.json', validPayload);
                const createOut = run(`curl -i -s -X POST -H "Content-Type: application/json" -d @payload.json "${url}/orders"`, 'Valid Order Creation (201)');
                md += createOut;

                // Extract order ID
                const match = createOut.match(/"id":\s*"([^"]+)"/);
                if (match) {
                    const oId = match[1];
                    // 10. Status update
                    const patchPayload = JSON.stringify({ status: 'accepted' });
                    fs.writeFileSync('payload.json', patchPayload);
                    md += run(`curl -i -s -X PATCH -H "Content-Type: application/json" -d @payload.json "${url}/orders/${oId}"`, 'Order Partial Update (Status)');

                    // 11. Deletion rejection (not pending)
                    md += run(`curl -i -s -X DELETE "${url}/orders/${oId}"`, 'Order Deletion Rejection (Not Pending)');
                }

                // 12. Rate-limit test
                if (menuRes.data.length >= 2) {
                    const mId2 = menuRes.data[1].id;
                    // Use second menu item for multi-item valid order test
                    const twoItemPayload = JSON.stringify({
                        customerId: cId,
                        restaurantId: rId,
                        items: [
                            { menuItemId: mId, quantity: 1 },
                            { menuItemId: mId2, quantity: 1 }
                        ]
                    });
                    fs.writeFileSync('payload.json', twoItemPayload);
                    md += run(`curl -i -s -X POST -H "Content-Type: application/json" -d @payload.json "${url}/orders"`, 'Valid Multi-Item Order (201)');
                }
            }
        }

        // Rate-limit test (spams read-only endpoint to avoid data side-effects)
        console.log('Spamming requests to trigger 429 rate limit...');
        let rateLimitOutput = '';
        for (let i = 0; i < 105; i++) {
            try {
                const res = execSync(`curl -i -s "${url}/restaurants?limit=1"`, { encoding: 'utf8', stdio: 'pipe' });
                if (res.includes('429 Too Many Requests') || res.includes('Retry-After')) {
                    rateLimitOutput = res;
                    break;
                }
            } catch (e) {
                if (e.stdout.includes('429 Too Many Requests')) {
                    rateLimitOutput = e.stdout;
                    break;
                }
            }
        }
        md += `### Rate Limit Rejection and Retry-After\n\n\`\`\`bash\n$ curl -i "${url}/restaurants"\n${rateLimitOutput}\n\`\`\`\n\n`;
    }

    if (fs.existsSync('payload.json')) {
        try { fs.unlinkSync('payload.json'); } catch (_) {}
    }
    fs.writeFileSync('./outputs/evidence.md', md);
    console.log('Evidence written to outputs/evidence.md');
}

main();
