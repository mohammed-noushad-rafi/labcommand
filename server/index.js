const express = require('express');
const cors    = require('cors');
const http    = require('http');
const dns     = require('dns');
const { Server } = require('socket.io');
require('dotenv').config();

// Railway's network has broken outbound IPv6 routing to some external hosts
// (observed with Gmail's SMTP servers, ENETUNREACH). Preferring IPv4 for all
// outbound connections avoids this app-wide. No effect on local dev.
dns.setDefaultResultOrder('ipv4first');

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
    // Coerce to Number consistently — agentRegistry keys must match exactly
    // what client:watch/unwatch send, or Map.get() silently returns undefined
    // and 'stream_start' never reaches the agent (no error, just nothing happens).
    const machineId = Number(data.machineId);
    const { hostname, ip, os } = data;
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

  socket.on('agent:violation', async (data) => {
    const { machineId, eventType, metadata } = data;
    const pool = require('./db/connection');
    const { processViolation } = require('./utils/trustScore');

    // The agent only reports raw observations (machineId, eventType) — it
    // has no idea which exam session is active. Resolve that here: find the
    // currently-active session this machine is enrolled in, and the
    // student/hostname to attribute the violation to.
    const { rows } = await pool.query(
      `SELECT ts.session_id, m.hostname
       FROM exam_trust_scores ts
       JOIN exam_sessions es ON es.id = ts.session_id
       JOIN machines m ON m.id = ts.machine_id
       WHERE ts.machine_id = $1 AND es.status = 'active'
       LIMIT 1`,
      [machineId]
    );

    if (rows.length === 0) {
      // No active exam session for this machine — nothing to attach the
      // violation to (e.g. it happened before the exam started).
      return;
    }

    const { session_id, hostname } = rows[0];
    await processViolation(session_id, machineId, hostname, eventType, metadata);
  });

  socket.on('agent:screenshot', (data) => {
    // Relay straight through to any client currently viewing this machine.
    io.emit('exam:screenshot', data);
  });

  // A browser tab viewing a machine's live screen (MachineDetail, Classroom
  // mode, or the exam war room) asks to start/stop receiving screenshots.
  socket.on('client:watch', ({ machineId }) => {
    const id = Number(machineId);
    if (!socket.watchingMachineIds) socket.watchingMachineIds = new Set();
    socket.watchingMachineIds.add(id);
    const agentSocket = agentRegistry.get(id);
    if (agentSocket) {
      agentSocket.emit('command', { type: 'stream_start' });
    }
  });

  socket.on('client:unwatch', ({ machineId }) => {
    const id = Number(machineId);
    if (socket.watchingMachineIds) socket.watchingMachineIds.delete(id);
    const agentSocket = agentRegistry.get(id);
    if (agentSocket) {
      agentSocket.emit('command', { type: 'stream_stop' });
    }
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
    // If this browser tab was watching a machine's live feed, tell that
    // agent to stop streaming so it doesn't keep capturing for nobody.
    if (socket.watchingMachineIds) {
      for (const id of socket.watchingMachineIds) {
        const agentSocket = agentRegistry.get(id);
        if (agentSocket) agentSocket.emit('command', { type: 'stream_stop' });
      }
    }
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
  });
});

global.io            = io;
global.agentRegistry = agentRegistry;

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`LabCommand server running on http://localhost:${PORT}`));