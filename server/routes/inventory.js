const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');
const auditLog    = require('../utils/auditLog');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { lab_id } = req.query;
    let q = `SELECT i.*, l.name as lab_name, l.id as lab_id,
      CASE WHEN i.quantity <= i.min_threshold THEN true ELSE false END as is_low
      FROM inventory i
      LEFT JOIN labs l ON i.lab_id = l.id WHERE 1=1`;
    const params = [];
    if (lab_id) { params.push(lab_id); q += ` AND i.lab_id=$${params.length}`; }
    q += ' ORDER BY is_low DESC, i.item_name';
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { lab_id, item_name, category, quantity, min_threshold, unit, supplier_name, supplier_contact } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO inventory (lab_id,item_name,category,quantity,min_threshold,unit,supplier_name,supplier_contact)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [lab_id, item_name, category, quantity||0, min_threshold||5, unit, supplier_name, supplier_contact]
    );
    await auditLog(req.user.id, 'CREATE', 'inventory', rows[0].id, `Added: ${item_name}`);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { quantity, item_name, category, min_threshold, unit, supplier_name, supplier_contact } = req.body;
    const { rows } = await pool.query(
      `UPDATE inventory SET quantity=$1,item_name=$2,category=$3,min_threshold=$4,
       unit=$5,supplier_name=$6,supplier_contact=$7,last_updated=NOW()
       WHERE id=$8 RETURNING *`,
      [quantity, item_name, category, min_threshold, unit, supplier_name, supplier_contact, req.params.id]
    );
    await auditLog(req.user.id, 'UPDATE', 'inventory', req.params.id, `Updated qty: ${quantity}`);
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;