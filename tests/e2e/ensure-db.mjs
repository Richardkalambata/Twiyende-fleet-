import pg from 'pg';

const client = new pg.Client({ connectionString: 'postgres://twende:twende@127.0.0.1:5432/postgres' });
await client.connect();
const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', ['twende_e2e']);
if (found.rowCount === 0) await client.query('CREATE DATABASE twende_e2e');
await client.end();
