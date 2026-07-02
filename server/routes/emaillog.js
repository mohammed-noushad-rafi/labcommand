const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM email_log ORDER BY sent_at DESC LIMIT 100'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
