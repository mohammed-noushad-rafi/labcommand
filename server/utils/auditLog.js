const pool = require('../db/connection');

async function auditLog(userId, action, tableName, recordId, details) {
  try {
    await pool.query(
      'INSERT INTO audit_log (user_id, action, table_name, record_id, details) VALUES ($1,$2,$3,$4,$5)',
      [userId, action, tableName, recordId, details]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = auditLog;