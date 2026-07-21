import asyncio
import websockets
import json
import psutil
import socket
import os
import subprocess
import platform
import base64
import io as iolib
import time
from datetime import datetime
from dotenv import load_dotenv

try:
    import mss
    from PIL import Image
    SCREENSHOT_AVAILABLE = True
except ImportError:
    SCREENSHOT_AVAILABLE = False
    print("[AGENT] Screenshot monitoring disabled — install with: pip install mss Pillow --break-system-packages")

try:
    import screeninfo
    MONITOR_CHECK_AVAILABLE = True
except ImportError:
    MONITOR_CHECK_AVAILABLE = False
    print("[AGENT] Multi-monitor detection disabled — install with: pip install screeninfo --break-system-packages")

load_dotenv()

SERVER_URL = os.getenv('SERVER_URL', 'http://localhost:3001')
MACHINE_ID = int(os.getenv('MACHINE_ID', 1))
WS_URL     = SERVER_URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/socket.io/?EIO=4&transport=websocket'

SCREENSHOT_INTERVAL_LOOPS = 4  # telemetry loop runs every 5s, so 4 * 5s = ~20s between ambient screenshots
SCREENSHOT_MAX_WIDTH = 480
SCREENSHOT_JPEG_QUALITY = 45

# Live mirroring: only runs while a browser client has this machine's detail
# page open (started/stopped via 'stream_start'/'stream_stop' commands from
# the server). Independent of the slow ambient screenshot loop above, which
# keeps running regardless so the War Room always has a recent thumbnail.
STREAM_INTERVAL = 0.4          # ~2.5 fps while actively watched
STREAM_MAX_DURATION = 300      # safety auto-stop if no renewed 'stream_start' arrives (seconds)
streaming_active = False
streaming_deadline = 0

def get_screenshot():
    """Capture the primary display, downscale, and return a base64 JPEG string. None on failure."""
    if not SCREENSHOT_AVAILABLE:
        return None
    try:
        with mss.mss() as sct:
            monitor = sct.monitors[1] if len(sct.monitors) > 1 else sct.monitors[0]
            raw = sct.grab(monitor)
            img = Image.frombytes('RGB', raw.size, raw.bgra, 'raw', 'BGRX')
            ratio = SCREENSHOT_MAX_WIDTH / img.width
            img = img.resize((SCREENSHOT_MAX_WIDTH, max(1, int(img.height * ratio))))
            buf = iolib.BytesIO()
            img.save(buf, format='JPEG', quality=SCREENSHOT_JPEG_QUALITY)
            return base64.b64encode(buf.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"[AGENT] Screenshot capture failed: {e}")
        return None

def get_removable_drives():
    """Return the set of currently mounted removable/external drive mount points."""
    drives = set()
    try:
        for part in psutil.disk_partitions(all=False):
            opts = part.opts or ''
            is_removable = 'removable' in opts.lower() or 'rw,noexec,nosuid,nodev' in opts.lower()
            # macOS external volumes typically mount under /Volumes (excluding the main drive)
            is_mac_external = platform.system() == 'Darwin' and part.mountpoint.startswith('/Volumes/')
            if is_removable or is_mac_external:
                drives.add(part.mountpoint)
    except Exception as e:
        print(f"[AGENT] Drive scan failed: {e}")
    return drives

def get_monitor_count():
    if not MONITOR_CHECK_AVAILABLE:
        return None
    try:
        return len(screeninfo.get_monitors())
    except Exception as e:
        print(f"[AGENT] Monitor check failed: {e}")
        return None

def get_telemetry():
    net = psutil.net_io_counters()
    return {
        'machineId': MACHINE_ID,
        'hostname':  socket.gethostname(),
        'ip':        socket.gethostbyname(socket.gethostname()),
        'os':        f"{platform.system()} {platform.release()}",
        'cpu':       psutil.cpu_percent(interval=1),
        'ram':       psutil.virtual_memory().percent,
        'disk':      psutil.disk_usage('/').percent,
        'ramTotal':  round(psutil.virtual_memory().total / (1024**3), 2),
        'ramUsed':   round(psutil.virtual_memory().used  / (1024**3), 2),
        'netSent':   round(net.bytes_sent / (1024**2), 2),
        'netRecv':   round(net.bytes_recv / (1024**2), 2),
    }

def get_processes():
    procs = []
    for p in psutil.process_iter(['pid','name','cpu_percent','memory_info']):
        try:
            procs.append({
                'pid':  p.info['pid'],
                'name': p.info['name'],
                'cpu':  p.info['cpu_percent'] or 0,
                'mem':  round((p.info['memory_info'].rss if p.info['memory_info'] else 0) / (1024**2), 2),
            })
        except:
            pass
    return sorted(procs, key=lambda x: x['cpu'], reverse=True)[:20]

def execute_command(cmd_type, content=''):
    global streaming_active, streaming_deadline
    try:
        if cmd_type == 'stream_start':
            streaming_active = True
            streaming_deadline = time.time() + STREAM_MAX_DURATION
            print("[AGENT] Live mirroring started")
            return

        if cmd_type == 'stream_stop':
            streaming_active = False
            print("[AGENT] Live mirroring stopped")
            return

        if cmd_type == 'shutdown':
            if platform.system() == 'Windows':
                subprocess.run(['shutdown', '/s', '/t', '0'])
            else:
                subprocess.run(['sudo', 'shutdown', '-h', 'now'])

        elif cmd_type == 'restart':
            if platform.system() == 'Windows':
                subprocess.run(['shutdown', '/r', '/t', '0'])
            else:
                subprocess.run(['sudo', 'reboot'])

        elif cmd_type == 'lock':
            if platform.system() == 'Darwin':
                subprocess.run(['osascript', '-e', 'tell application "System Events" to keystroke "q" using {control down, command down}'])
            elif platform.system() == 'Windows':
                subprocess.run(['rundll32.exe', 'user32.dll,LockWorkStation'])

        elif cmd_type == 'message':
            if platform.system() == 'Darwin':
                subprocess.run(['osascript', '-e', f'display notification "{content}" with title "LabCommand"'])
            elif platform.system() == 'Windows':
                subprocess.run(['msg', '*', content])
            else:
                subprocess.run(['notify-send', 'LabCommand', content])

        print(f"[CMD] Executed: {cmd_type}")
    except Exception as e:
        print(f"[CMD ERROR] {cmd_type}: {e}")

async def stream_loop(sio):
    """Runs continuously in the background. Only actually captures/emits
    while streaming_active is True (toggled by 'stream_start'/'stream_stop'
    commands). Auto-stops if no renewed 'stream_start' arrives before the
    deadline, in case a viewer's browser tab closes without a clean unwatch."""
    global streaming_active
    while True:
        if streaming_active:
            if time.time() > streaming_deadline:
                streaming_active = False
                print("[AGENT] Live mirroring auto-stopped (no renewal — viewer likely disconnected)")
            elif sio.connected:
                shot = get_screenshot()
                if shot:
                    await sio.emit('agent:screenshot', {
                        'machineId': MACHINE_ID,
                        'image': shot,
                    })
        await asyncio.sleep(STREAM_INTERVAL)

async def connect():
    import socketio
    sio = socketio.AsyncClient(logger=False, engineio_logger=False)
    asyncio.create_task(stream_loop(sio))

    @sio.event
    async def connect():
        print(f"[AGENT] Connected to LabCommand server")
        t = get_telemetry()
        await sio.emit('agent:register', {
            'machineId': MACHINE_ID,
            'hostname':  t['hostname'],
            'ip':        t['ip'],
            'os':        t['os'],
        })
        print(f"[AGENT] Registered as Machine ID {MACHINE_ID} — {t['hostname']} ({t['ip']})")

    @sio.event
    async def disconnect():
        print("[AGENT] Disconnected from server")

    @sio.on('command')
    async def on_command(data):
        print(f"[AGENT] Command received: {data}")
        execute_command(data.get('type',''), data.get('content',''))

    while True:
        try:
            await sio.connect(SERVER_URL, transports=['websocket'])

            baseline_drives = get_removable_drives()
            baseline_monitor_count = get_monitor_count()
            loop_count = 0
            print(f"[AGENT] Baseline: {len(baseline_drives)} removable drive(s), {baseline_monitor_count if baseline_monitor_count is not None else '?'} monitor(s)")

            while sio.connected:
                try:
                    t = get_telemetry()
                    await sio.emit('agent:telemetry', t)

                    procs = get_processes()
                    await sio.emit('agent:processes', {
                        'machineId': MACHINE_ID,
                        'processes': procs
                    })

                    # USB / removable drive detection — flag any drive not present at session start
                    current_drives = get_removable_drives()
                    new_drives = current_drives - baseline_drives
                    for drive in new_drives:
                        print(f"[AGENT] New removable drive detected: {drive}")
                        await sio.emit('agent:violation', {
                            'machineId': MACHINE_ID,
                            'eventType': 'usb_device',
                            'metadata': {'mountpoint': drive}
                        })
                    baseline_drives = current_drives  # accept the new state so we don't re-flag the same drive every loop

                    # Multi-monitor detection — flag if monitor count increases mid-session
                    current_monitor_count = get_monitor_count()
                    if current_monitor_count is not None and baseline_monitor_count is not None and current_monitor_count > baseline_monitor_count:
                        print(f"[AGENT] Monitor count increased: {baseline_monitor_count} -> {current_monitor_count}")
                        await sio.emit('agent:violation', {
                            'machineId': MACHINE_ID,
                            'eventType': 'multi_monitor',
                            'metadata': {'previousCount': baseline_monitor_count, 'newCount': current_monitor_count}
                        })
                        baseline_monitor_count = current_monitor_count  # don't re-flag the same extra monitor every loop

                    # Live screenshot — throttled to roughly every SCREENSHOT_INTERVAL_LOOPS * 5s
                    if loop_count % SCREENSHOT_INTERVAL_LOOPS == 0:
                        shot = get_screenshot()
                        if shot:
                            await sio.emit('agent:screenshot', {
                                'machineId': MACHINE_ID,
                                'image': shot,
                            })

                    loop_count += 1
                    await asyncio.sleep(5)
                except Exception as e:
                    print(f"[AGENT] Telemetry error: {e}")
                    await asyncio.sleep(5)

            await sio.disconnect()
        except Exception as e:
            print(f"[AGENT] Connection failed: {e}")
            print("[AGENT] Retrying in 10 seconds...")
            await asyncio.sleep(10)

if __name__ == '__main__':
    print(f"[AGENT] Starting LabCommand Agent — Machine ID: {MACHINE_ID}")
    asyncio.run(connect())
