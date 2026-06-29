const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');
const auditLog    = require('../utils/auditLog');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, e.name as equipment_name, e.category, l.name as lab_name
      FROM maintenance m
      JOIN equipment e ON m.equipment_id = e.id
      JOIN labs l ON e.lab_id = l.id
      ORDER BY m.scheduled_date ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { equipment_id, scheduled_date, description, technician, cost } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO maintenance (equipment_id,scheduled_date,description,technician,cost)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [equipment_id, scheduled_date, description, technician, cost||0]
    );
    await auditLog(req.user.id, 'CREATE', 'maintenance', rows[0].id, `Scheduled for equipment ${equipment_id}`);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, completed_date, technician, cost, description } = req.body;
    const { rows } = await pool.query(
      `UPDATE maintenance SET status=$1,completed_date=$2,technician=$3,cost=$4,description=$5
       WHERE id=$6 RETURNING *`,
      [status, completed_date||null, technician, cost, description, req.params.id]
    );
    await auditLog(req.user.id, 'UPDATE', 'maintenance', req.params.id, `Status: ${status}`);
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM maintenance WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;