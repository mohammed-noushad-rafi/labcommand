
const { Pool } = require('pg');
require('dotenv').config();
 
// Local Postgres (Homebrew on Mac) typically needs neither a password nor
// SSL. Cloud-hosted Postgres (Railway, etc.) requires both. Detect based on
// whether DB_HOST points at localhost, so the same code works in both
// environments without extra config beyond setting DB_PASS on Railway.
const isLocal = !process.env.DB_HOST || process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';
 
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl:      isLocal ? false : { rejectUnauthorized: false },
});
 
pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to PostgreSQL — labcommand');
  }
});
 
module.exports = pool;