const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');
const auditLog    = require('../utils/auditLog');

router.use(verifyToken);

router.get('/sessions', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT cs.*, l.name as lab_name, u.name as created_by_name
      FROM classroom_sessions cs
      LEFT JOIN labs l ON cs.lab_id = l.id
      LEFT JOIN users u ON cs.created_by = u.id
      ORDER BY cs.created_at DESC LIMIT 20
    `);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/start', async (req, res) => {
  try {
    const { lab_id, session_name, message } = req.body;
    const machines = await pool.query(
      `SELECT id, hostname FROM machines WHERE lab_id=$1`, [lab_id]
    );
    let locked = 0;
    for (const m of machines.rows) {
      const socket = global.agentRegistry.get(m.id);
      if (socket) {
        socket.emit('command', {
          type: 'classroom_lock',
          sessionName: session_name,
          message: message || 'Class in session'
        });
        locked++;
      }
      await pool.query(
        `UPDATE machines SET status='classroom' WHERE id=$1`, [m.id]
      );
    }
    global.io.emit('classroom:started', { lab_id, session_name });
    await auditLog(req.user.id, 'CREATE', 'machines', lab_id, `Classroom started: ${session_name}`);
    res.json({ success: true, machines: machines.rows.length, locked });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/end', async (req, res) => {
  try {
    const { lab_id } = req.body;
    const machines = await pool.query(
      `SELECT id FROM machines WHERE lab_id=$1`, [lab_id]
    );
    for (const m of machines.rows) {
      const socket = global.agentRegistry.get(m.id);
      if (socket) socket.emit('command', { type: 'classroom_unlock' });
      await pool.query(
        `UPDATE machines SET status='offline' WHERE id=$1`, [m.id]
      );
    }
    global.io.emit('classroom:ended', { lab_id });
    await auditLog(req.user.id, 'UPDATE', 'machines', lab_id, 'Classroom session ended');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/broadcast', async (req, res) => {
  try {
    const { lab_id, message } = req.body;
    const machines = await pool.query(
      `SELECT id FROM machines WHERE lab_id=$1`, [lab_id]
    );
    let sent = 0;
    for (const m of machines.rows) {
      const socket = global.agentRegistry.get(m.id);
      if (socket) { socket.emit('command', { type: 'message', content: message }); sent++; }
    }
    res.json({ success: true, sent });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;