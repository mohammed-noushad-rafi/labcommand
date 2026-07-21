const express     = require('express');
const router      = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole   = require('../middleware/checkRole');
const auditLog    = require('../utils/auditLog');

router.use(verifyToken);
router.use(checkRole('admin', 'staff'));

router.post('/:machineId', async (req, res) => {
  try {
    const { machineId } = req.params;
    const { type, content } = req.body;
    const registry = global.agentRegistry;

    const socket = registry.get(parseInt(machineId));
    if (!socket) {
      return res.status(404).json({ success: false, message: 'Machine not connected' });
    }

    socket.emit('command', { type, content });
    await auditLog(req.user.id, `CMD_${type.toUpperCase()}`, 'machines', parseInt(machineId), `Command: ${type}`);
    res.json({ success: true, message: `Command "${type}" sent` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;