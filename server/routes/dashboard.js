const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/summary', async (req, res) => {
  try {
    const { lab_id } = req.query;
    const hasLab = lab_id && lab_id !== 'all';
    const labParam = hasLab ? [lab_id] : [];

    const machines = await pool.query(
      hasLab
        ? "SELECT COUNT(*) FROM machines WHERE status='online' AND lab_id=$1"
        : "SELECT COUNT(*) FROM machines WHERE status='online'",
      labParam
    );

    const alerts = await pool.query(
      hasLab
        ? `SELECT COUNT(*) FROM alerts a
           LEFT JOIN machines m ON a.machine_id=m.id
           WHERE a.is_read=false AND m.lab_id=$1`
        : "SELECT COUNT(*) FROM alerts WHERE is_read=false",
      labParam
    );

    const complaints = await pool.query(
      hasLab
        ? `SELECT COUNT(*) FROM complaints c
           JOIN equipment e ON c.equipment_id=e.id
           WHERE c.status IN ('open','in_progress') AND e.lab_id=$1`
        : "SELECT COUNT(*) FROM complaints WHERE status IN ('open','in_progress')",
      labParam
    );

    const lowStock = await pool.query(
      hasLab
        ? "SELECT COUNT(*) FROM inventory WHERE quantity <= min_threshold AND lab_id=$1"
        : "SELECT COUNT(*) FROM inventory WHERE quantity <= min_threshold",
      labParam
    );

    const examsToday = await pool.query(
      hasLab
        ? "SELECT COUNT(*) FROM exam_sessions WHERE exam_date=CURRENT_DATE AND lab_id=$1"
        : "SELECT COUNT(*) FROM exam_sessions WHERE exam_date=CURRENT_DATE",
      labParam
    );

    const criticalAI = await pool.query(
      hasLab
        ? `SELECT COUNT(*) FROM ai_predictions p
           JOIN equipment e ON p.equipment_id=e.id
           WHERE p.risk_level='critical' AND e.lab_id=$1`
        : "SELECT COUNT(*) FROM ai_predictions WHERE risk_level='critical'",
      labParam
    );

    const equipStatus = await pool.query(
      hasLab
        ? `SELECT status, COUNT(*) as value FROM equipment WHERE lab_id=$1 GROUP BY status`
        : `SELECT status, COUNT(*) as value FROM equipment GROUP BY status`,
      labParam
    );

    const weeklySlots = await pool.query(
      hasLab
        ? `SELECT TO_CHAR(date,'Dy') as day, COUNT(*) as bookings
           FROM slots WHERE date >= CURRENT_DATE - 6 AND lab_id=$1
           GROUP BY date, TO_CHAR(date,'Dy') ORDER BY date`
        : `SELECT TO_CHAR(date,'Dy') as day, COUNT(*) as bookings
           FROM slots WHERE date >= CURRENT_DATE - 6
           GROUP BY date, TO_CHAR(date,'Dy') ORDER BY date`,
      labParam
    );

    const maintenanceDue = await pool.query(
      hasLab
        ? `SELECT m.*, e.name as equipment_name, l.name as lab_name
           FROM maintenance m
           JOIN equipment e ON m.equipment_id = e.id
           JOIN labs l ON e.lab_id = l.id
           WHERE m.status IN ('scheduled','in_progress')
             AND m.scheduled_date <= CURRENT_DATE + 14
             AND e.lab_id=$1
           ORDER BY m.scheduled_date LIMIT 5`
        : `SELECT m.*, e.name as equipment_name, l.name as lab_name
           FROM maintenance m
           JOIN equipment e ON m.equipment_id = e.id
           JOIN labs l ON e.lab_id = l.id
           WHERE m.status IN ('scheduled','in_progress')
             AND m.scheduled_date <= CURRENT_DATE + 14
           ORDER BY m.scheduled_date LIMIT 5`,
      labParam
    );

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