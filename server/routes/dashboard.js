const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/summary', async (req, res) => {
  try {
    const machines    = await pool.query("SELECT COUNT(*) FROM machines WHERE status='online'");
    const alerts      = await pool.query("SELECT COUNT(*) FROM alerts WHERE is_read=false");
    const complaints  = await pool.query("SELECT COUNT(*) FROM complaints WHERE status IN ('open','in_progress')");
    const lowStock    = await pool.query("SELECT COUNT(*) FROM inventory WHERE quantity <= min_threshold");
    const examsToday  = await pool.query("SELECT COUNT(*) FROM exam_sessions WHERE exam_date=CURRENT_DATE");
    const criticalAI  = await pool.query("SELECT COUNT(*) FROM ai_predictions WHERE risk_level='critical'");
    const equipStatus = await pool.query(`
      SELECT status, COUNT(*) as value
      FROM equipment GROUP BY status
    `);
    const weeklySlots = await pool.query(`
      SELECT TO_CHAR(date,'Dy') as day, COUNT(*) as bookings
      FROM slots
      WHERE date >= CURRENT_DATE - 6
      GROUP BY date, TO_CHAR(date,'Dy')
      ORDER BY date
    `);
    const maintenanceDue = await pool.query(`
      SELECT m.*, e.name as equipment_name, l.name as lab_name
      FROM maintenance m
      JOIN equipment e ON m.equipment_id = e.id
      JOIN labs l ON e.lab_id = l.id
      WHERE m.status IN ('scheduled','in_progress')
        AND m.scheduled_date <= CURRENT_DATE + 14
      ORDER BY m.scheduled_date
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        machines_online:  parseInt(machines.rows[0].count),
        active_alerts:    parseInt(alerts.rows[0].count),
        open_complaints:  parseInt(complaints.rows[0].count),
        low_stock:        parseInt(lowStock.rows[0].count),
        exams_today:      parseInt(examsToday.rows[0].count),
        critical_ai:      parseInt(criticalAI.rows[0].count),
      },
      equipment_status:  equipStatus.rows,
      weekly_slots:      weeklySlots.rows,
      maintenance_due:   maintenanceDue.rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;