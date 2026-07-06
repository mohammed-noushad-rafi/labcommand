const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');
const auditLog    = require('../utils/auditLog');
const { sendBookingNotification } = require('../utils/mailer');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { role, id } = req.user;
    let q = `SELECT s.*, l.name as lab_name, u.name as user_name,
             a.name as assigned_to_name
             FROM slots s
             JOIN labs l ON s.lab_id = l.id
             JOIN users u ON s.user_id = u.id
             LEFT JOIN users a ON s.assigned_to = a.id`;
    const params = [];
    if (role === 'student') {
      params.push(id);
      q += ` WHERE s.user_id=$1`;
    }
    q += ' ORDER BY s.date DESC, s.start_time DESC';
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { lab_id, date, start_time, end_time, purpose, assigned_to, assigned_name, notes } = req.body;

    const conflict = await pool.query(
      `SELECT id FROM slots WHERE lab_id=$1 AND date=$2
       AND status NOT IN ('cancelled')
       AND (start_time < $4 AND end_time > $3)`,
      [lab_id, date, start_time, end_time]
    );
    if (conflict.rows.length) {
      return res.status(400).json({ success: false, message: 'Time slot already booked' });
    }

    const lab = await pool.query(`SELECT name FROM labs WHERE id=$1`, [lab_id]);
    const labName = lab.rows[0]?.name || 'Lab';

    const { rows } = await pool.query(
      `INSERT INTO slots (lab_id, user_id, date, start_time, end_time, purpose, assigned_to, assigned_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [lab_id, req.user.id, date, start_time, end_time, purpose, assigned_to||null, assigned_name||null, notes||null]
    );

    await auditLog(req.user.id, 'CREATE', 'slots', rows[0].id, `Booked ${labName} on ${date}`);

    if (global.io) {
      global.io.emit('booking:new', {
        lab_name:   labName,
        user_name:  req.user.name,
        date,
        start_time,
        end_time,
        purpose: purpose || '',
      });
    }

    // Send email to all users
    const allUsers = await pool.query('SELECT email FROM users WHERE is_active=true');
    const recipients = allUsers.rows.map(u => u.email).filter(Boolean);
    // If assigned to someone, add their email to recipients
    let finalRecipients = [...recipients];
    if (assigned_to) {
      const assignedUser = await pool.query('SELECT email FROM users WHERE id=$1', [assigned_to]);
      if (assignedUser.rows[0]?.email && !finalRecipients.includes(assignedUser.rows[0].email)) {
        finalRecipients.push(assignedUser.rows[0].email);
      }
    }

    sendBookingNotification({
      lab_name: labName,
      user_name: req.user.name,
      date, start_time, end_time,
      purpose: purpose || '',
      assigned_to: assigned_name || null,
      recipients: finalRecipients,
    });

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/cancel', async (req, res) => {
  try {
    await pool.query(`UPDATE slots SET status='cancelled' WHERE id=$1`, [req.params.id]);
    await auditLog(req.user.id, 'UPDATE', 'slots', req.params.id, 'Booking cancelled');

    if (global.io) {
      global.io.emit('booking:cancelled', { slot_id: req.params.id });
    }

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