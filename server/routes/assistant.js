const express     = require('express');
const router      = express.Router();
const pool        = require('../db/connection');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });

    const [machines, equipment, complaints, inventory, maintenance, labs, exams, alerts] = await Promise.all([
      pool.query(`SELECT m.hostname, m.status, m.ip_address, m.last_seen, l.name as lab
                  FROM machines m LEFT JOIN labs l ON m.lab_id=l.id`),
      pool.query(`SELECT e.name, e.category, e.status, e.usage_hours, e.fault_count,
                  e.last_service_date, l.name as lab
                  FROM equipment e LEFT JOIN labs l ON e.lab_id=l.id`),
      pool.query(`SELECT c.title, c.status, c.priority, c.created_at,
                  e.name as equipment_name, u.name as raised_by, l.name as lab
                  FROM complaints c
                  JOIN equipment e ON c.equipment_id=e.id
                  JOIN labs l ON e.lab_id=l.id
                  LEFT JOIN users u ON c.raised_by=u.id
                  ORDER BY c.created_at DESC LIMIT 50`),
      pool.query(`SELECT i.item_name, i.quantity, i.min_threshold, i.unit,
                  l.name as lab,
                  CASE WHEN i.quantity<=i.min_threshold THEN true ELSE false END as is_low
                  FROM inventory i LEFT JOIN labs l ON i.lab_id=l.id`),
      pool.query(`SELECT m.status, m.scheduled_date, m.technician, m.cost,
                  e.name as equipment_name, l.name as lab
                  FROM maintenance m
                  JOIN equipment e ON m.equipment_id=e.id
                  JOIN labs l ON e.lab_id=l.id
                  ORDER BY m.scheduled_date`),
      pool.query(`SELECT * FROM labs`),
      pool.query(`SELECT es.title, es.status, es.exam_date, l.name as lab
                  FROM exam_sessions es LEFT JOIN labs l ON es.lab_id=l.id
                  ORDER BY es.created_at DESC LIMIT 10`),
      pool.query(`SELECT a.type, a.severity, a.title, a.message, a.created_at, a.is_read
                  FROM alerts a ORDER BY a.created_at DESC LIMIT 20`),
    ]);

    const dbContext = `You are the LabCommand AI assistant for a college lab management system.
Answer questions based ONLY on the real-time data provided below. Be concise and specific.
Give exact numbers when asked. Format lists clearly. Today is ${new Date().toLocaleDateString('en-IN', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}.

LABS (${labs.rows.length} total): ${JSON.stringify(labs.rows)}

MACHINES (${machines.rows.length} total - Online: ${machines.rows.filter(m=>m.status==='online').length}, Offline: ${machines.rows.filter(m=>m.status==='offline').length}):
${JSON.stringify(machines.rows)}

EQUIPMENT (${equipment.rows.length} items - Working: ${equipment.rows.filter(e=>e.status==='working').length}, Faulty: ${equipment.rows.filter(e=>e.status==='faulty').length}, Maintenance: ${equipment.rows.filter(e=>e.status==='maintenance').length}):
${JSON.stringify(equipment.rows)}

COMPLAINTS (Open: ${complaints.rows.filter(c=>c.status==='open').length}, In progress: ${complaints.rows.filter(c=>c.status==='in_progress').length}, Resolved: ${complaints.rows.filter(c=>c.status==='resolved').length}):
${JSON.stringify(complaints.rows)}

INVENTORY (Low stock: ${inventory.rows.filter(i=>i.is_low).length} items):
${JSON.stringify(inventory.rows)}

MAINTENANCE: ${JSON.stringify(maintenance.rows)}
EXAMS: ${JSON.stringify(exams.rows)}
ALERTS: ${JSON.stringify(alerts.rows)}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: dbContext }] },
          contents: [{ parts: [{ text: message }] }],
        }),
      }
    );

    const data = await response.json();
    if (data.error) return res.status(500).json({ success: false, message: data.error.message });

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    res.json({ success: true, reply });

  } catch (err) {
    console.error('Assistant error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
