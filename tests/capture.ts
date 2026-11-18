import { E2E_BASE_URL, E2E_DATABASE_URL, assertLocalServer, assertSafeDatabase } from './db-guard';

/**
 * Screenshot and video capture must use the local e2e database.
 * This script checks the incoming environment, then pins both the
 * database and the server to that local target. It does not open a browser.
 * Start the server with the printed command, then point Playwright at E2E_BASE_URL.
 */
assertSafeDatabase(process.env.DATABASE_URL, 'capture');
assertLocalServer(process.env.BASE_URL, 'capture');

process.env.DATABASE_URL = E2E_DATABASE_URL;
process.env.DATABASE_URL_UNPOOLED = E2E_DATABASE_URL;
process.env.BASE_URL = E2E_BASE_URL;
process.env.PAYMENT_PROVIDER = 'simulated';

console.log(`Capture target ${E2E_BASE_URL}`);
console.log(`Database ${new URL(E2E_DATABASE_URL).pathname.slice(1)}`);
console.log(`DATABASE_URL=${E2E_DATABASE_URL} DATABASE_URL_UNPOOLED=${E2E_DATABASE_URL} PAYMENT_PROVIDER=simulated npx next start -p 3050`);
