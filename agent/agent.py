import asyncio
import websockets
import json
import psutil
import socket
import os
import subprocess
import platform
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SERVER_URL = os.getenv('SERVER_URL', 'http://localhost:3001')
MACHINE_ID = int(os.getenv('MACHINE_ID', 1))
WS_URL     = SERVER_URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/socket.io/?EIO=4&transport=websocket'

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
    try:
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

async def connect():
    import socketio
    sio = socketio.AsyncClient(logger=False, engineio_logger=False)

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

            while sio.connected:
                try:
                    t = get_telemetry()
                    await sio.emit('agent:telemetry', t)

                    procs = get_processes()
                    await sio.emit('agent:processes', {
                        'machineId': MACHINE_ID,
                        'processes': procs
                    })

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