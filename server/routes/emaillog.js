const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const staffDept = req.user?.role === 'staff' ? req.user?.department : null;
    let q = 'SELECT * FROM email_log';
    const params = [];
    if (staffDept) {
      // Filter by labs belonging to staff department
      q = `SELECT e.* FROM email_log e
            JOIN labs l ON l.name = e.lab_name
            WHERE l.department = $1`;
      params.push(staffDept);
    }
    q += ' ORDER BY sent_at DESC LIMIT 100';
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
