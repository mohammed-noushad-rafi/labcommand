const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.*, m.hostname, l.name as lab_name
      FROM alerts a
      LEFT JOIN machines m ON a.machine_id = m.id
      LEFT JOIN labs l ON a.lab_id = l.id
      ORDER BY a.created_at DESC LIMIT 50
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE alerts SET is_read=true WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;