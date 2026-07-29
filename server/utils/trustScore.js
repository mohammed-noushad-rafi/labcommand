const pool = require('../db/connection');

const WEIGHTS = {
  tab_switch:         10,
  fullscreen_exit:    15,
  clipboard_paste:    20,
  devtools_open:      30,
  new_process:        25,
  concurrent_session: 40,
  inactivity:          2,
  right_click:         5,
  usb_device:         20,
  multi_monitor:      15,
};

async function processViolation(sessionId, machineId, studentName, eventType, metadata = {}) {
  try {
    const { rows } = await pool.query(
      `SELECT trust_score, is_locked FROM exam_trust_scores WHERE session_id=$1 AND machine_id=$2`,
      [sessionId, machineId]
    );

    if (!rows.length) return null;
    const current = rows[0];
    if (current.is_locked) return current;

    const session = await pool.query(
      `SELECT violation_weights, auto_lock_threshold FROM exam_sessions WHERE id=$1`, [sessionId]
    );
    const weights   = session.rows[0]?.violation_weights || WEIGHTS;
    const threshold = session.rows[0]?.auto_lock_threshold || 40;

    const deduction   = weights[eventType] || 5;
    const newScore    = Math.max(0, current.trust_score - deduction);
    const shouldLock  = newScore <= threshold;
    const severity    = deduction >= 25 ? 'critical' : deduction >= 15 ? 'high' : 'medium';

    await pool.query(
      `UPDATE exam_trust_scores SET trust_score=$1, is_locked=$2, updated_at=NOW()
       WHERE session_id=$3 AND machine_id=$4`,
      [newScore, shouldLock, sessionId, machineId]
    );

    await pool.query(
      `INSERT INTO exam_events (session_id, machine_id, student_name, event_type, severity, trust_score_before, trust_score_after, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [sessionId, machineId, studentName, eventType, severity, current.trust_score, newScore, JSON.stringify(metadata)]
    );

    const result = { machineId, studentName, eventType, severity, trustScoreBefore: current.trust_score, trustScoreAfter: newScore, isLocked: shouldLock };

    global.io.emit('exam:violation', result);

    if (shouldLock) {
      const socket = global.agentRegistry.get(machineId);
      if (socket) socket.emit('command', { type: 'exam_lock', reason: 'Trust score too low' });
      global.io.emit('exam:machine_locked', { machineId, sessionId, trustScore: newScore });
    }

    return result;
  } catch (err) {
    console.error('Trust score error:', err.message);
    return null;
  }
}

module.exports = { processViolation };