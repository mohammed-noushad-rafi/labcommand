const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');
const auditLog    = require('../utils/auditLog');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { role, id } = req.user;
    const { lab_id } = req.query;
    let q = `SELECT c.*, e.name as equipment_name, e.serial_number, e.category,
             l.name as lab_name, l.id as lab_id,
             u1.name as raised_by_name, u2.name as assigned_to_name
             FROM complaints c
             JOIN equipment e ON c.equipment_id = e.id
             JOIN labs l ON e.lab_id = l.id
             LEFT JOIN users u1 ON c.raised_by = u1.id
             LEFT JOIN users u2 ON c.assigned_to = u2.id
             WHERE 1=1`;
    const params = [];
    if (role === 'student') { params.push(id); q += ` AND c.raised_by=$${params.length}`; }
    if (lab_id) { params.push(lab_id); q += ` AND l.id=$${params.length}`; }
    q += ' ORDER BY c.created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { equipment_id, title, description, priority } = req.body;
    const sla_deadline = priority === 'high'
      ? new Date(Date.now() + 4*60*60*1000)
      : priority === 'medium'
      ? new Date(Date.now() + 24*60*60*1000)
      : null;
    const { rows } = await pool.query(
      `INSERT INTO complaints (equipment_id,raised_by,title,description,priority,sla_deadline)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [equipment_id, req.user.id, title, description, priority||'medium', sla_deadline]
    );
    await auditLog(req.user.id, 'CREATE', 'complaints', rows[0].id, `Raised: ${title}`);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, assigned_to, priority } = req.body;
    const { rows } = await pool.query(
      `UPDATE complaints SET status=$1,assigned_to=$2,priority=$3,updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [status, assigned_to||null, priority, req.params.id]
    );
    await auditLog(req.user.id, 'UPDATE', 'complaints', req.params.id, `Status: ${status}`);
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;