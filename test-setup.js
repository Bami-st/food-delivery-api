/**
 * test-setup.js — Creates an isolated PostgreSQL schema, seeds minimal test data,
 * starts the API server against it on a dedicated port, runs test-local.js and
 * verify.js, and tears down the isolated schema.
 *
 * Usage:  node test-setup.js
 *
 * Isolation strategy:
 *   All tables are pushed into a dedicated "test_pr1" schema in PostgreSQL
 *   (leaving "public" completely untouched).
 *   After tests complete (or if an error occurs), the "test_pr1" schema is
 *   dropped with CASCADE, leaving zero test artifacts behind.
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const TEST_PORT = process.env.TEST_PORT || 3001;
const TEST_SCHEMA_NAME = 'test_pr1';
const ROOT = __dirname;

// Read .env without exposing credentials in output
require('dotenv').config({ path: path.join(ROOT, '.env') });

const { PrismaClient } = require('@prisma/client');

const BASE_DB_URL = process.env.DATABASE_URL;
const BASE_DIRECT_URL = process.env.DIRECT_URL;

if (!BASE_DB_URL || !BASE_DIRECT_URL) {
    console.error('[setup] DATABASE_URL and DIRECT_URL must be set in .env');
    process.exit(1);
}

function buildTestUrl(baseUrl) {
    const url = new URL(baseUrl);
    url.searchParams.set('schema', TEST_SCHEMA_NAME);
    return url.toString();
}

const TEST_DB_URL = buildTestUrl(BASE_DB_URL);
const TEST_DIRECT_URL = buildTestUrl(BASE_DIRECT_URL);

function killProcessTree(pid) {
    try {
        if (process.platform === 'win32') {
            execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
        } else {
            process.kill(pid, 'SIGKILL');
        }
    } catch (_) {}
}

async function main() {
    console.log('====================================================');
    console.log('  Isolated Test Suite (PostgreSQL Schema Isolation)');
    console.log(`  Schema: ${TEST_SCHEMA_NAME}`);
    console.log(`  Port:   ${TEST_PORT}`);
    console.log('====================================================\n');

    const adminPrisma = new PrismaClient({
        datasources: { db: { url: BASE_DIRECT_URL } }
    });

    let server = null;
    let testLocalExitCode = 0;
    let verifyExitCode = 0;

    try {
        // 1. Create isolated schema
        console.log('[1/6] Creating isolated schema in database...');
        await adminPrisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS ${TEST_SCHEMA_NAME};`);
        console.log(`      Schema "${TEST_SCHEMA_NAME}" created.`);

        // 2. Push tables into the test schema
        console.log('[2/6] Pushing Prisma models into isolated schema...');
        execSync(`npx prisma db push --schema prisma/schema.prisma --skip-generate --accept-data-loss`, {
            cwd: ROOT,
            encoding: 'utf8',
            stdio: 'pipe',
            env: {
                ...process.env,
                DATABASE_URL: TEST_DB_URL,
                DIRECT_URL: TEST_DIRECT_URL
            }
        });
        console.log('      Tables created in isolated schema.');

        // 3. Seed minimal test data into test schema
        console.log('[3/6] Seeding minimal test data into isolated schema...');
        const testPrisma = new PrismaClient({
            datasources: { db: { url: TEST_DIRECT_URL } }
        });

        await testPrisma.customer.create({
            data: {
                firstName: 'Test',
                lastName: 'User',
                email: 'test-pr1@example.com',
                phone: '555-0001'
            }
        });

        await testPrisma.restaurant.create({
            data: {
                name: 'Test Restaurant',
                description: 'For isolated integration testing',
                address: '123 Test Street',
                menuItems: {
                    create: [
                        { name: 'Test Burger', priceCents: 999, currency: 'USD', isAvailable: true },
                        { name: 'Test Fries', priceCents: 499, currency: 'USD', isAvailable: true }
                    ]
                }
            }
        });

        const counts = {
            customers: await testPrisma.customer.count(),
            restaurants: await testPrisma.restaurant.count(),
            menuItems: await testPrisma.menuItem.count()
        };
        console.log('      Seeded:', JSON.stringify(counts));
        await testPrisma.$disconnect();

        // 4. Start API server on TEST_PORT against isolated schema
        console.log(`[4/6] Starting API server on port ${TEST_PORT} against isolated schema...`);
        server = spawn('node', ['index.js'], {
            cwd: ROOT,
            env: {
                ...process.env,
                PORT: String(TEST_PORT),
                DATABASE_URL: TEST_DB_URL,
                DIRECT_URL: TEST_DIRECT_URL,
                RATE_LIMIT_WINDOW_MS: '60000',
                RATE_LIMIT_MAX: '50'
            },
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let serverOutput = '';
        server.stdout.on('data', d => { serverOutput += d.toString(); });
        server.stderr.on('data', d => { serverOutput += d.toString(); });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Server did not start within 15s. Output:\n${serverOutput}`));
            }, 15000);

            const check = setInterval(() => {
                if (serverOutput.includes('listening')) {
                    clearInterval(check);
                    clearTimeout(timeout);
                    resolve();
                }
            }, 200);

            server.on('exit', (code) => {
                clearInterval(check);
                clearTimeout(timeout);
                reject(new Error(`Server exited early with code ${code}. Output:\n${serverOutput}`));
            });
        });
        console.log(`      Server ready at http://localhost:${TEST_PORT}/api/v1`);

        // 5. Run test-local.js
        console.log('\n[5/6] Executing test-local.js against isolated server...');
        try {
            execSync(`node test-local.js`, {
                cwd: ROOT,
                encoding: 'utf8',
                stdio: 'inherit',
                env: {
                    ...process.env,
                    TEST_URL: `http://localhost:${TEST_PORT}/api/v1`
                }
            });
            console.log('      test-local.js passed all checks.');
        } catch (e) {
            testLocalExitCode = e.status || 1;
            console.error('      test-local.js failed.');
        }

        // 6. Run verify.js
        console.log('\n[6/6] Executing verify.js against isolated server...');
        try {
            execSync(`node verify.js`, {
                cwd: ROOT,
                encoding: 'utf8',
                stdio: 'inherit',
                env: {
                    ...process.env,
                    VERIFY_URL: `http://localhost:${TEST_PORT}/api/v1`
                }
            });
            console.log('      verify.js completed and generated outputs/evidence.md.');
        } catch (e) {
            verifyExitCode = e.status || 1;
            console.error('      verify.js failed with error.');
        }

    } finally {
        // Teardown: Stop server
        if (server && server.pid) {
            console.log('\n[teardown] Stopping test server...');
            killProcessTree(server.pid);
            console.log('           Server stopped.');
        }

        // Teardown: Drop schema
        console.log(`[teardown] Dropping isolated schema "${TEST_SCHEMA_NAME}"...`);
        try {
            await adminPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA_NAME} CASCADE;`);
            console.log(`           Schema "${TEST_SCHEMA_NAME}" dropped successfully.`);
        } catch (err) {
            console.error('           Warning: failed to drop schema:', err.message);
        } finally {
            await adminPrisma.$disconnect();
        }
    }

    console.log('\n====================================================');
    console.log('  Isolated Test Summary:');
    console.log(`    test-local.js exit code: ${testLocalExitCode}`);
    console.log(`    verify.js     exit code: ${verifyExitCode}`);
    console.log('====================================================\n');

    if (testLocalExitCode !== 0 || verifyExitCode !== 0) {
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal error in test setup:', err);
    process.exit(1);
});
