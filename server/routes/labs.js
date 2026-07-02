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
router.get('/departments', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT department, 
        json_agg(json_build_object('id',id,'name',name,'capacity',capacity) ORDER BY id) as labs,
        COUNT(id)::int as lab_count
       FROM labs 
       WHERE department IS NOT NULL
       GROUP BY department
       ORDER BY department`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
