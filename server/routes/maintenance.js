const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');
const auditLog    = require('../utils/auditLog');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { lab_id } = req.query;
    let q = `SELECT m.*, e.name as equipment_name, e.serial_number, e.category, l.name as lab_name, l.id as lab_id
      FROM maintenance m
      JOIN equipment e ON m.equipment_id = e.id
      JOIN labs l ON e.lab_id = l.id WHERE 1=1`;
    const params = [];
    if (lab_id) { params.push(lab_id); q += ` AND l.id=$${params.length}`; }
    q += ' ORDER BY m.scheduled_date ASC';
    const { rows } = await pool.query(q, params);
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
router.get('/technicians', async (req, res) => {
  try {
    const { department } = req.query;
    let q = 'SELECT * FROM technicians WHERE is_available=true';
    const params = [];
    if (department) {
      q += ' AND (department=$1 OR department IS NULL)';
      params.push(department);
    }
    q += ' ORDER BY name';
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});