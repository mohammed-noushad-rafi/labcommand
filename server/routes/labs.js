const express      = require('express');
const router       = express.Router();
const pool         = require('../db/connection');
const verifyToken  = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM labs WHERE is_active=true ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, location, capacity } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO labs (name, location, capacity) VALUES ($1,$2,$3) RETURNING *',
      [name, location, capacity || 30]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;