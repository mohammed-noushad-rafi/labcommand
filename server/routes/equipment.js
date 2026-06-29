const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');
const auditLog    = require('../utils/auditLog');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { lab_id, status } = req.query;
    let q = `SELECT e.*, l.name as lab_name FROM equipment e
             LEFT JOIN labs l ON e.lab_id = l.id WHERE 1=1`;
    const params = [];
    if (lab_id) { params.push(lab_id); q += ` AND e.lab_id=$${params.length}`; }
    if (status)  { params.push(status);  q += ` AND e.status=$${params.length}`; }
    q += ' ORDER BY e.name';
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, l.name as lab_name FROM equipment e
       LEFT JOIN labs l ON e.lab_id = l.id WHERE e.id=$1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { lab_id, name, category, serial_number, status, purchase_date, last_service_date, warranty_expiry_date, amc_vendor, amc_expiry_date } = req.body;
    const qr_token = `EQ-${Date.now()}`;
    const { rows } = await pool.query(
      `INSERT INTO equipment (lab_id,name,category,serial_number,status,purchase_date,last_service_date,warranty_expiry_date,amc_vendor,amc_expiry_date,qr_token)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [lab_id, name, category, serial_number, status||'working', purchase_date||null, last_service_date||null, warranty_expiry_date||null, amc_vendor||null, amc_expiry_date||null, qr_token]
    );
    await auditLog(req.user.id, 'CREATE', 'equipment', rows[0].id, `Added: ${name}`);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, serial_number, status, purchase_date, last_service_date, warranty_expiry_date, amc_vendor, amc_expiry_date } = req.body;
    const { rows } = await pool.query(
      `UPDATE equipment SET name=$1,category=$2,serial_number=$3,status=$4,purchase_date=$5,
       last_service_date=$6,warranty_expiry_date=$7,amc_vendor=$8,amc_expiry_date=$9
       WHERE id=$10 RETURNING *`,
      [name, category, serial_number, status, purchase_date||null, last_service_date||null, warranty_expiry_date||null, amc_vendor||null, amc_expiry_date||null, req.params.id]
    );
    await auditLog(req.user.id, 'UPDATE', 'equipment', req.params.id, `Updated: ${name}`);
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM equipment WHERE id=$1', [req.params.id]);
    await auditLog(req.user.id, 'DELETE', 'equipment', req.params.id, 'Equipment deleted');
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;