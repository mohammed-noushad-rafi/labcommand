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

router.get('/:id/report', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const { id } = req.params;

    const sessionResult = await pool.query(
      `SELECT e.*, l.name as lab_name, l.department, u.name as created_by_name
       FROM exam_sessions e
       LEFT JOIN labs l ON e.lab_id = l.id
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = $1`,
      [id]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam session not found' });
    }
    const session = sessionResult.rows[0];

    const scoresResult = await pool.query(
      `SELECT ts.*, m.hostname, m.ip_address
       FROM exam_trust_scores ts
       JOIN machines m ON ts.machine_id = m.id
       WHERE ts.session_id = $1
       ORDER BY ts.trust_score ASC`,
      [id]
    );
    const scores = scoresResult.rows;

    const eventsResult = await pool.query(
      `SELECT * FROM exam_events WHERE session_id = $1 ORDER BY recorded_at ASC`,
      [id]
    );
    const events = eventsResult.rows;

    await auditLog(req.user.id, 'READ', 'exam_sessions', id, `Downloaded report: ${session.title}`);

    // Stream the PDF directly as the HTTP response — no temp file needed.
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="exam-report-${id}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#4f46e5').text('LabCommand — Exam Report', { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(16).fillColor('#16161f').text(session.title);
    doc.fontSize(10).fillColor('#7c7c8a').text(
      `${session.lab_name || 'Unknown lab'} · ${session.department || ''} Department`
    );
    doc.text(
      `Date: ${new Date(session.exam_date).toLocaleDateString('en-IN')}  ·  ` +
      `Time: ${session.start_time || '-'} – ${session.end_time || '-'}  ·  ` +
      `Status: ${session.status}`
    );
    doc.text(`Created by: ${session.created_by_name || 'Unknown'}`);
    doc.moveDown(1);

    // Summary stats
    const totalCandidates = scores.length;
    const avgScore = totalCandidates
      ? Math.round(scores.reduce((sum, s) => sum + s.trust_score, 0) / totalCandidates)
      : 0;
    const lockedCount = scores.filter(s => s.is_locked).length;
    const totalViolations = events.length;

    doc.fontSize(12).fillColor('#16161f').text('Summary', { underline: true });
    doc.fontSize(10).fillColor('#333').text(
      `Candidates: ${totalCandidates}    Average trust score: ${avgScore}    ` +
      `Machines locked: ${lockedCount}    Total violations: ${totalViolations}`
    );
    doc.moveDown(1);

    // Per-machine final scores table
    doc.fontSize(12).fillColor('#16161f').text('Final Trust Scores', { underline: true });
    doc.moveDown(0.3);
    scores.forEach(s => {
      const statusLabel = s.is_locked ? 'LOCKED' : 'Active';
      const color = s.trust_score < 50 ? '#dc2626' : s.trust_score < 80 ? '#d97706' : '#0f9d58';
      doc.fontSize(10).fillColor('#16161f').text(
        `${s.hostname}  (${s.ip_address || '-'})`,
        { continued: true }
      );
      doc.fillColor(color).text(`   Trust: ${s.trust_score}   ${statusLabel}`);
    });
    doc.moveDown(1);

    // Violation timeline
    doc.fontSize(12).fillColor('#16161f').text('Violation Timeline', { underline: true });
    doc.moveDown(0.3);
    if (events.length === 0) {
      doc.fontSize(10).fillColor('#7c7c8a').text('No violations recorded during this session.');
    } else {
      events.forEach(e => {
        const time = new Date(e.recorded_at).toLocaleString('en-IN');
        doc.fontSize(9).fillColor('#7c7c8a').text(time, { continued: true });
        doc.fillColor('#16161f').text(`   Machine #${e.machine_id}   ${e.event_type}   (score ${e.trust_score_before} -> ${e.trust_score_after})`);
      });
    }

    doc.moveDown(1.5);
    doc.fontSize(8).fillColor('#bbb').text(
      `Generated by LabCommand on ${new Date().toLocaleString('en-IN')}`,
      { align: 'center' }
    );

    doc.end();
  } catch (err) {
    console.error('[PDF report] error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;