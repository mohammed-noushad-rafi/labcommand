const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');
const auditLog    = require('../utils/auditLog');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*, l.name as lab_name, u.name as created_by_name,
        COUNT(DISTINCT et.machine_id) as machine_count,
        COUNT(DISTINCT ev.id) as event_count
      FROM exam_sessions e
      LEFT JOIN labs l ON e.lab_id = l.id
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN exam_trust_scores et ON et.session_id = e.id
      LEFT JOIN exam_events ev ON ev.session_id = e.id
      GROUP BY e.id, l.name, u.name
      ORDER BY e.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { lab_id, title, exam_date, start_time, end_time, auto_lock_threshold, violation_weights } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO exam_sessions (lab_id, created_by, title, exam_date, start_time, end_time, auto_lock_threshold, violation_weights)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [lab_id, req.user.id, title, exam_date, start_time, end_time, auto_lock_threshold||40, violation_weights||null]
    );
    await auditLog(req.user.id, 'CREATE', 'exam_sessions', rows[0].id, `Created exam: ${title}`);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE exam_sessions SET status='active' WHERE id=$1 RETURNING *`, [id]
    );
    const session = rows[0];

    const machines = await pool.query(
      `SELECT id, hostname FROM machines WHERE lab_id=$1 AND status='online'`, [session.lab_id]
    );

    for (const machine of machines.rows) {
      const socket = global.agentRegistry.get(machine.id);
      if (socket) socket.emit('command', { type: 'exam_start', sessionId: id, title: session.title });

      await pool.query(
        `INSERT INTO exam_trust_scores (session_id, machine_id, student_name, trust_score)
         VALUES ($1,$2,$3,100)
         ON CONFLICT (session_id, machine_id) DO UPDATE SET trust_score=100, is_locked=false`,
        [id, machine.id, machine.hostname]
      ).catch(() => {});
    }

    global.io.emit('exam:started', { sessionId: id, title: session.title });
    await auditLog(req.user.id, 'UPDATE', 'exam_sessions', id, 'Exam started');
    res.json({ success: true, machines: machines.rows.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE exam_sessions SET status='completed' WHERE id=$1`, [id]);

    const machines = await pool.query(
      `SELECT machine_id FROM exam_trust_scores WHERE session_id=$1`, [id]
    );
    for (const m of machines.rows) {
      const socket = global.agentRegistry.get(m.machine_id);
      if (socket) socket.emit('command', { type: 'exam_end' });
    }

    global.io.emit('exam:ended', { sessionId: id });
    await auditLog(req.user.id, 'UPDATE', 'exam_sessions', id, 'Exam ended');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id/scores', async (req, res) => {
  try {
    const scores = await pool.query(
      `SELECT ts.*, m.hostname, m.ip_address
       FROM exam_trust_scores ts
       JOIN machines m ON ts.machine_id = m.id
       WHERE ts.session_id=$1
       ORDER BY ts.trust_score ASC`,
      [req.params.id]
    );
    const events = await pool.query(
      `SELECT * FROM exam_events WHERE session_id=$1 ORDER BY recorded_at DESC LIMIT 50`,
      [req.params.id]
    );
    res.json({ success: true, scores: scores.rows, events: events.rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;