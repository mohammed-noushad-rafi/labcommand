const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const bcrypt      = require('bcryptjs');
const verifyToken = require('../middleware/verifyToken');
const checkRole   = require('../middleware/checkRole');
const auditLog    = require('../utils/auditLog');
const { sendWelcomeEmail } = require('../utils/mailer');

router.use(verifyToken);
router.get('/assignable', checkRole('admin', 'staff'), async (req, res) => {
  try {
    const { role, department } = req.user;
    let q = `SELECT id, name, role, department FROM users
              WHERE is_active = true AND role IN ('student', 'invigilator', 'staff')`;
    const params = [];

    if (role === 'staff') {
      params.push(department);
      q += ` AND department = $${params.length}`;
    }

    q += ' ORDER BY department, name';
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/', checkRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, department, is_active, created_at FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', checkRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role, department)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, email, role, department, is_active, created_at`,
      [name, email, hashed, role||'student', (role==='staff'||role==='student')?department:null]
    );
    await auditLog(req.user.id, 'CREATE', 'users', rows[0].id, `Created user: ${name}`);

    // Send welcome email with credentials
    sendWelcomeEmail({ name, email, password, role, department });

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Email already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', checkRole('admin'), async (req, res) => {
  try {
    const { name, role, department, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET name=$1, role=$2, department=$3, is_active=$4 WHERE id=$5
       RETURNING id, name, email, role, department, is_active`,
      [name, role, (role==='staff'||role==='student')?department:null, is_active, req.params.id]
    );
    await auditLog(req.user.id, 'UPDATE', 'users', req.params.id, `Updated: ${name}`);
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
