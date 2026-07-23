const { Pool } = require('pg');
require('dotenv').config();

// Two supported modes:
// 1. DATABASE_URL set (Railway, or any host that provides one) — use it
//    directly. This is the more robust path: one correctly-formatted string
//    from the provider, rather than 5 separately reconstructed fields that
//    each have to be individually correct.
// 2. No DATABASE_URL — fall back to individual DB_HOST/PORT/NAME/USER/PASS
//    fields, for local dev (Homebrew Postgres on Mac, no password/SSL needed).
const isLocal = !process.env.DATABASE_URL && (!process.env.DB_HOST || process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host:     process.env.DB_HOST,
      port:     process.env.DB_PORT,
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASS,
      ssl:      isLocal ? false : { rejectUnauthorized: false },
    };

const pool = new Pool(poolConfig);

console.log('DB config mode:', process.env.DATABASE_URL ? 'DATABASE_URL' : 'individual fields', '| isLocal:', isLocal);

pool.connect((err) => {
  if (err) {
    console.error('Database connection error — full details:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      syscall: err.syscall,
      hostname: err.hostname,
      stack: err.stack,
    });
  } else {
    console.log('Connected to PostgreSQL — labcommand');
  }
});

module.exports = pool;
