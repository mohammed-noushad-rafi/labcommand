const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');
const auditLog    = require('../utils/auditLog');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { role, id } = req.user;
    let q = `SELECT s.*, l.name as lab_name, u.name as user_name
             FROM slots s
             JOIN labs l ON s.lab_id = l.id
             JOIN users u ON s.user_id = u.id`;
    const params = [];
    if (role === 'student') { params.push(id); q += ` WHERE s.user_id=$1`; }
    q += ' ORDER BY s.date DESC, s.start_time DESC';
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { lab_id, date, start_time, end_time, purpose } = req.body;
    const conflict = await pool.query(
      `SELECT id FROM slots WHERE lab_id=$1 AND date=$2
       AND status NOT IN ('cancelled')
       AND (start_time < $4 AND end_time > $3)`,
      [lab_id, date, start_time, end_time]
    );
    if (conflict.rows.length) {
      return res.status(400).json({ success: false, message: 'Time slot already booked' });
    }
    const { rows } = await pool.query(
      `INSERT INTO slots (lab_id, user_id, date, start_time, end_time, purpose)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [lab_id, req.user.id, date, start_time, end_time, purpose]
    );
    await auditLog(req.user.id, 'CREATE', 'slots', rows[0].id, `Booked ${lab_id} on ${date}`);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/cancel', async (req, res) => {
  try {
    await pool.query(`UPDATE slots SET status='cancelled' WHERE id=$1`, [req.params.id]);
    await auditLog(req.user.id, 'UPDATE', 'slots', req.params.id, 'Booking cancelled');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/checkin', async (req, res) => {
  try {
    await pool.query(`UPDATE slots SET status='checked_in' WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;