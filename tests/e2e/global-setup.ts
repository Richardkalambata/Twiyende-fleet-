import { assertLocalServer, assertSafeDatabase } from '../db-guard';

export default function globalSetup(): void {
  assertSafeDatabase(process.env.DATABASE_URL, 'e2e');
  assertLocalServer(process.env.BASE_URL, 'e2e');
}
