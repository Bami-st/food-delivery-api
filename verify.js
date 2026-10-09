const fs = require('fs');
const { execSync } = require('child_process');

const url = 'http://localhost:3000/api/v1';

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

    // 1. Paginated Response
    md += run(`curl -i -s -g "${url}/restaurants?limit=2&offset=0"`, 'Paginated Response');

    // 2. Limit Clamping
    md += run(`curl -i -s -g "${url}/restaurants?limit=5000"`, 'Maximum Limit Clamping');

    // 3. Negative Offset
    md += run(`curl -i -s -g "${url}/restaurants?offset=-5"`, 'Invalid Offset Rejection');

    // 4. Invalid sort field
    md += run(`curl -i -s -g "${url}/restaurants?sort=unknown"`, 'Invalid Sort Field');

    // 5. Get a customer and restaurant for order testing
    const restRes = JSON.parse(execSync(`curl -s "${url}/restaurants?limit=1"`, { encoding: 'utf8' }));
    const custRes = JSON.parse(execSync(`curl -s "${url}/customers?limit=1"`, { encoding: 'utf8' }));
    
    if (restRes.data.length && custRes.data.length) {
        const rId = restRes.data[0].id;
        const cId = custRes.data[0].id;
        const menuRes = JSON.parse(execSync(`curl -s "${url}/restaurants/${rId}/menu-items?limit=1"`, { encoding: 'utf8' }));
        
        if (menuRes.data.length) {
            const mId = menuRes.data[0].id;

            // 6. Create Order
            const payload = JSON.stringify({
                customerId: cId,
                restaurantId: rId,
                items: [{ menuItemId: mId, quantity: 2 }]
            });
            fs.writeFileSync('payload.json', payload);
            const createOut = run(`curl -i -s -X POST -H "Content-Type: application/json" -d @payload.json "${url}/orders"`, 'Order Creation');
            md += createOut;

            // Extract order ID
            const match = createOut.match(/"id":\s*"([^"]+)"/);
            if (match) {
                const oId = match[1];
                // 7. Partial Update
                md += run(`curl -i -s -X PATCH -H "Content-Type: application/json" -d "{\\"status\\":\\"accepted\\"}" "${url}/orders/${oId}"`, 'Order Partial Update (Status)');
                
                // 8. Deletion rejection (not pending)
                md += run(`curl -i -s -X DELETE "${url}/orders/${oId}"`, 'Order Deletion Rejection (Not Pending)');
            }
        }
    }

    // 9. Rate limit (100 requests)
    console.log("Spamming requests to trigger 429 rate limit...");
    let rateLimitOutput = '';
    for(let i = 0; i < 105; i++) {
        try {
            const res = execSync(`curl -i -s "${url}/restaurants?limit=1"`, { encoding: 'utf8', stdio: 'pipe' });
            if (res.includes('429 Too Many Requests') || res.includes('Retry-After')) {
                rateLimitOutput = res;
                break;
            }
        } catch(e) {
            if (e.stdout.includes('429 Too Many Requests')) {
                rateLimitOutput = e.stdout;
                break;
            }
        }
    }
    md += `### Rate Limit Rejection and Retry-After\n\n\`\`\`bash\n$ curl -i "${url}/restaurants"\n${rateLimitOutput}\n\`\`\`\n\n`;

    fs.writeFileSync('./outputs/evidence.md', md);
    console.log('Evidence written to outputs/evidence.md');
}

main();
