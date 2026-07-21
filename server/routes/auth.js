const express  = require('express');
const router   = express.Router();
const pool     = require('../db/connection');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const auditLog = require('../utils/auditLog');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1 AND is_active=true', [email]);
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department || null },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await auditLog(user.id, 'LOGIN', 'users', user.id, 'User logged in');

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department || null }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public self-registration intentionally removed: it's unused by the app
// (all account creation goes through the admin-gated POST /api/users route
// in routes/users.js) and previously allowed anyone to self-assign any role,
// including admin, with no authentication at all.

module.exports = router;