const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, l.name as lab_name,
        t.cpu_percent, t.ram_percent, t.disk_percent,
        t.ram_total_gb, t.ram_used_gb, t.recorded_at as last_telemetry
      FROM machines m
      LEFT JOIN labs l ON m.lab_id = l.id
      LEFT JOIN LATERAL (
        SELECT * FROM telemetry_snapshots
        WHERE machine_id = m.id
        ORDER BY recorded_at DESC LIMIT 1
      ) t ON true
      ORDER BY m.lab_id, m.row_pos, m.col_pos
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, l.name as lab_name
      FROM machines m
      LEFT JOIN labs l ON m.lab_id = l.id
      WHERE m.id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Machine not found' });

    const telemetry = await pool.query(`
      SELECT * FROM telemetry_snapshots
      WHERE machine_id = $1
      ORDER BY recorded_at DESC LIMIT 60
    `, [req.params.id]);

    const processes = await pool.query(`
      SELECT DISTINCT ON (process_name) *
      FROM process_log
      WHERE machine_id = $1
      ORDER BY process_name, recorded_at DESC
    `, [req.params.id]);

    res.json({
      success: true,
      data: rows[0],
      telemetry: telemetry.rows,
      processes: processes.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;