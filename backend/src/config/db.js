import pg from 'pg';
import { config } from './env.js';

const { Pool, types } = pg;

// Return PostgreSQL DATE columns (OID 1082) as exact YYYY-MM-DD strings without timezone conversion
types.setTypeParser(1082, (str) => str);

export const pgPool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false
  }
});

pgPool.on('error', (err) => {
  console.error('⚠️ Unexpected idle client error on PostgreSQL pool:', err);
});

