const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');
const checkRole   = require('../middleware/checkRole');

router.use(verifyToken, checkRole('admin'));

router.get('/', async (req, res) => {
  try {
    const labId = req.query.lab_id ? parseInt(req.query.lab_id) : null;
    const labFilter = labId ? 'AND m.lab_id = $1' : '';
    const labFilterSlots = labId ? 'AND s.lab_id = $1' : '';
    const params = labId ? [labId] : [];

    const [peakHours, topProcesses, labUtilization, dailyBookings, machineUptime, complaintsData, energyData] = await Promise.all([
      pool.query(`
        SELECT EXTRACT(HOUR FROM recorded_at)::int as hour,
               COUNT(*)::int as readings,
               ROUND(AVG(cpu_percent)::numeric, 1) as avg_cpu,
               ROUND(AVG(ram_percent)::numeric, 1) as avg_ram
        FROM telemetry_snapshots
        WHERE recorded_at >= NOW() - INTERVAL '7 days'
        ${labId ? 'AND machine_id IN (SELECT id FROM machines WHERE lab_id = $1)' : ''}
        GROUP BY EXTRACT(HOUR FROM recorded_at)::int
        ORDER BY hour
      `, params).catch(() => ({ rows: [] })),

      pool.query(`
        SELECT process_name,
               COUNT(*)::int as frequency,
               ROUND(AVG(cpu_percent)::numeric, 1) as avg_cpu,
               ROUND(AVG(mem_mb)::numeric, 1) as avg_mem
        FROM process_log
        WHERE recorded_at >= NOW() - INTERVAL '7 days'
          AND process_name != ''
          ${labId ? 'AND machine_id IN (SELECT id FROM machines WHERE lab_id = $1)' : ''}
        GROUP BY process_name
        ORDER BY frequency DESC
        LIMIT 15
      `, params).catch(() => ({ rows: [] })),

      pool.query(`
        SELECT l.name as lab_name,
               COUNT(DISTINCT m.id)::int as total_machines,
               COUNT(DISTINCT CASE WHEN m.status='online' THEN m.id END)::int as online_machines,
               COUNT(DISTINCT s.id)::int as total_bookings
        FROM labs l
        LEFT JOIN machines m ON m.lab_id = l.id
        LEFT JOIN slots s ON s.lab_id = l.id AND s.status != 'cancelled'
        ${labId ? 'WHERE l.id = $1' : ''}
        GROUP BY l.id, l.name
        ORDER BY l.name
      `, params).catch(() => ({ rows: [] })),

      pool.query(`
        SELECT TO_CHAR(date, 'DD Mon') as day,
               COUNT(*)::int as bookings
        FROM slots
        WHERE date >= CURRENT_DATE - 14
        ${labId ? 'AND lab_id = $1' : ''}
        GROUP BY date, TO_CHAR(date, 'DD Mon')
        ORDER BY date
      `, params).catch(() => ({ rows: [] })),

      pool.query(`
        SELECT m.hostname, m.status, m.last_seen,
               l.name as lab_name,
               COUNT(t.id)::int as telemetry_count,
               ROUND(AVG(t.cpu_percent)::numeric, 1) as avg_cpu,
               ROUND(AVG(t.ram_percent)::numeric, 1) as avg_ram
        FROM machines m
        LEFT JOIN labs l ON m.lab_id = l.id
        LEFT JOIN telemetry_snapshots t ON t.machine_id = m.id
          AND t.recorded_at >= NOW() - INTERVAL '24 hours'
        WHERE 1=1 ${labFilter}
        GROUP BY m.id, m.hostname, m.status, m.last_seen, l.name
        ORDER BY telemetry_count DESC
      `, params).catch(() => ({ rows: [] })),

      pool.query(`
        SELECT TO_CHAR(DATE(created_at), 'DD Mon') as day,
               COUNT(*)::int as count,
               COUNT(CASE WHEN priority='high' THEN 1 END)::int as high,
               COUNT(CASE WHEN status='resolved' THEN 1 END)::int as resolved
        FROM complaints
        WHERE 1=1
        ${labId ? 'AND lab_id = $1' : ''}
        GROUP BY DATE(created_at), TO_CHAR(DATE(created_at), 'DD Mon')
        ORDER BY DATE(created_at)
      `, params).catch(() => ({ rows: [] })),

      pool.query(`
        SELECT m.hostname, l.name as lab_name,
               COUNT(t.id)::int as active_readings,
               ROUND((COUNT(t.id) * 5.0 / 3600 * 0.15)::numeric, 3) as estimated_kwh
        FROM machines m
        LEFT JOIN labs l ON m.lab_id = l.id
        LEFT JOIN telemetry_snapshots t ON t.machine_id = m.id
          AND t.recorded_at >= NOW() - INTERVAL '30 days'
        WHERE 1=1 ${labFilter}
        GROUP BY m.id, m.hostname, l.name
        ORDER BY estimated_kwh DESC
      `, params).catch(() => ({ rows: [] })),
    ]);

    const totalKwh = energyData.rows.reduce((s, r) => s + parseFloat(r.estimated_kwh || 0), 0);

    res.json({
      success: true,
      peak_hours:       peakHours.rows,
      top_processes:    topProcesses.rows,
      lab_utilization:  labUtilization.rows,
      daily_bookings:   dailyBookings.rows,
      machine_uptime:   machineUptime.rows,
      complaints_trend: complaintsData.rows,
      energy: {
        machines:           energyData.rows,
        total_kwh:          Math.round(totalKwh * 100) / 100,
        estimated_cost_inr: Math.round(totalKwh * 8),
      },
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
