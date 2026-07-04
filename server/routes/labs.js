const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');
const auditLog    = require('../utils/auditLog');

router.use(verifyToken);

router.get('/departments', async (req, res) => {
  // Staff only see their assigned department
  const staffDept = req.user?.role === 'staff' ? req.user?.department : null;
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

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM labs ORDER BY id');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, capacity, department } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO labs (name, capacity, department) VALUES ($1,$2,$3) RETURNING *',
      [name, capacity, department]
    );
    await auditLog(req.user.id, 'CREATE', 'labs', rows[0].id, `Created lab: ${name}`);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, capacity, department } = req.body;
    const { rows } = await pool.query(
      'UPDATE labs SET name=$1, capacity=$2, department=$3 WHERE id=$4 RETURNING *',
      [name, capacity, department, req.params.id]
    );
    await auditLog(req.user.id, 'UPDATE', 'labs', req.params.id, `Updated lab: ${name}`);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM labs WHERE id=$1', [req.params.id]);
    await auditLog(req.user.id, 'DELETE', 'labs', req.params.id, 'Deleted lab');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
