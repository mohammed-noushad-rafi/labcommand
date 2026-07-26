const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const auditLog    = require('../utils/auditLog');
const verifyToken = require('../middleware/verifyToken');

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

router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'User not found' });

    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hashed, req.user.id]);
    await auditLog(req.user.id, 'UPDATE', 'users', req.user.id, 'Changed own password');

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;