const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET','POST'] }
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
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
app.use('/api/auditlog', require('./routes/auditlog'));
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
  
  socket.on('exam:violation', async (data) => {
    const { sessionId, machineId, studentName, eventType, metadata } = data;
    const { processViolation } = require('./utils/trustScore');
    await processViolation(sessionId, machineId, studentName, eventType, metadata);
  });  

    const pool = require('./db/connection');
    await pool.query(
      `UPDATE machines SET status='online', ip_address=$1, os_info=$2, last_seen=NOW()
       WHERE id=$3`,
      [ip, os, machineId]
    );

    io.emit('machine:status', { machineId, status: 'online', hostname, ip });
    console.log(`Agent registered: ${hostname} (${ip})`);
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
  });
});

global.io            = io;
global.agentRegistry = agentRegistry;

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`LabCommand server running on http://localhost:${PORT}`));