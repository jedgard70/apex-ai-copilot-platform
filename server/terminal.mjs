import os from 'os';
import { WebSocketServer } from 'ws';
import pty from 'node-pty';

export function attachTerminal(server) {
  const wss = new WebSocketServer({ server, path: '/terminal' });
  
  wss.on('connection', (ws) => {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.cwd(),
      env: process.env
    });

    ptyProcess.onData((data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    });

    ws.on('message', (msg) => {
      try {
        const text = msg.toString('utf8');
        if (text.startsWith('{"type":"resize"')) {
          const payload = JSON.parse(text);
          ptyProcess.resize(payload.cols, payload.rows);
          return;
        }
        ptyProcess.write(text);
      } catch (err) {
        ptyProcess.write(msg.toString('utf8'));
      }
    });

    ws.on('close', () => {
      try {
        ptyProcess.kill();
      } catch (err) {
        // Ignore
      }
    });
  });

  console.log('[Terminal] WebSocket server attached on /terminal');
}
