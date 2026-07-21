const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// CLIENT_URL supports one or more comma-separated origins, e.g.
// "http://localhost:5173,http://10.71.41.157:5173" — add every address the
// web app is actually served from (dev machine, LAN IP, eventual production
// domain). A "*" wildcard is deliberately not supported here: it would
// accept requests from any website, not just this app, and is invalid
// alongside credentials:true anyway (browsers reject that combination).
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOriginCheck = (origin, callback) => {
  // requests with no Origin header (server-to-server, curl, the Python agent)
  // aren't subject to browser CORS at all — always allow those through.
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  callback(new Error(`Origin ${origin} not allowed by CORS`));
};

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: corsOriginCheck, methods: ['GET','POST'] }
});

app.use(cors({ origin: corsOriginCheck, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/labs',      require('./routes/labs'));
app.use('/api/machines',  require('./routes/machines'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/alerts',    require('./routes/alerts'));
app.use('/api/commands', require('./routes/commands'));
app.use('/api/equipment',   require('./routes/equipment'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/complaints',  require('./routes/complaints'));
app.use('/api/inventory',   require('./routes/inventory'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/booking',  require('./routes/booking'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/emaillog', require('./routes/emaillog'));
app.use('/api/auditlog', require('./routes/auditlog'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/classroom', require('./routes/classroom'));
app.use('/api/assistant', require('./routes/assistant'));
app.get('/', (req, res) => res.json({ success: true, message: 'LabCommand API running' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error' });
});

const agentRegistry = new Map();

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('agent:register', async (data) => {
    const { machineId, hostname, ip, os } = data;
    agentRegistry.set(machineId, socket);
    socket.machineId = machineId;

    const pool = require('./db/connection');
    await pool.query(
      `UPDATE machines SET status='online', ip_address=$1, os_info=$2, last_seen=NOW()
       WHERE id=$3`,
      [ip, os, machineId]
    );

    io.emit('machine:status', { machineId, status: 'online', hostname, ip });
    console.log(`Agent registered: ${hostname} (${ip})`);
  });

  // Violations reported directly by a student's exam browser tab (tab switch, paste, devtools, etc).
  socket.on('exam:violation', async (data) => {
    const { sessionId, machineId, studentName, eventType, metadata } = data;
    const { processViolation } = require('./utils/trustScore');
    await processViolation(sessionId, machineId, studentName, eventType, metadata);
  });

  // Violations reported by the machine agent itself (USB device, extra monitor, etc).
  // The agent only knows its machineId, not which exam session is active on it —
  // so we resolve that from the currently-active exam_trust_scores row for this machine.
  socket.on('agent:violation', async (data) => {
    const { machineId, eventType, metadata } = data;
    const pool = require('./db/connection');
    const { processViolation } = require('./utils/trustScore');

    const { rows } = await pool.query(
      `SELECT ts.session_id, ts.student_name
       FROM exam_trust_scores ts
       JOIN exam_sessions es ON es.id = ts.session_id
       WHERE ts.machine_id = $1 AND es.status = 'active' AND ts.is_locked = false
       ORDER BY ts.updated_at DESC LIMIT 1`,
      [machineId]
    );

    if (rows.length) {
      await processViolation(rows[0].session_id, machineId, rows[0].student_name, eventType, metadata);
    }
  });

  // Live exam-room screenshot feed — relayed straight through, not persisted.
  socket.on('agent:screenshot', (data) => {
    const { machineId, image } = data;
    io.emit('exam:screenshot', { machineId, image, ts: Date.now() });
  });

  // A browser client opened a machine's detail page — tell that specific
  // agent to switch into fast-capture live-mirror mode. Re-sent every ~60s
  // by the client as a heartbeat while the page stays open (renews the
  // agent's own safety auto-stop timer, in case the tab is closed uncleanly).
  socket.on('client:watch', ({ machineId }) => {
    socket.watchingMachineId = machineId; // remembered so we can stop it on abrupt disconnect
    const agentSocket = agentRegistry.get(machineId);
    if (agentSocket) agentSocket.emit('command', { type: 'stream_start' });
  });

  socket.on('client:unwatch', ({ machineId }) => {
    socket.watchingMachineId = null;
    const agentSocket = agentRegistry.get(machineId);
    if (agentSocket) agentSocket.emit('command', { type: 'stream_stop' });
  });

  socket.on('agent:telemetry', async (data) => {
    const { machineId, cpu, ram, disk, ramTotal, ramUsed, netSent, netRecv } = data;
    const pool = require('./db/connection');

    await pool.query(
      `INSERT INTO telemetry_snapshots
       (machine_id, cpu_percent, ram_percent, disk_percent, ram_total_gb, ram_used_gb, net_sent_mb, net_recv_mb)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [machineId, cpu, ram, disk, ramTotal, ramUsed, netSent, netRecv]
    );

    await pool.query('UPDATE machines SET last_seen=NOW() WHERE id=$1', [machineId]);
    io.emit('machine:telemetry', { machineId, cpu, ram, disk, ramTotal, ramUsed });
  });

  socket.on('agent:processes', async (data) => {
    const { machineId, processes } = data;
    const pool = require('./db/connection');
    for (const p of processes) {
      await pool.query(
        `INSERT INTO process_log (machine_id, process_name, pid, cpu_percent, mem_mb)
         VALUES ($1,$2,$3,$4,$5)`,
        [machineId, p.name, p.pid, p.cpu, p.mem]
      );
    }
    io.emit('machine:processes', { machineId, processes });
  });

  socket.on('disconnect', async () => {
    if (socket.machineId) {
      agentRegistry.delete(socket.machineId);
      const pool = require('./db/connection');
      await pool.query(
        "UPDATE machines SET status='offline' WHERE id=$1",
        [socket.machineId]
      );
      io.emit('machine:status', { machineId: socket.machineId, status: 'offline' });
      console.log(`Agent disconnected: machine ${socket.machineId}`);
    }
    if (socket.watchingMachineId) {
      const agentSocket = agentRegistry.get(socket.watchingMachineId);
      if (agentSocket) agentSocket.emit('command', { type: 'stream_stop' });
    }
  });
});

global.io            = io;
global.agentRegistry = agentRegistry;

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`LabCommand server running on http://localhost:${PORT}`));
