import os from 'os';
import { WebSocketServer } from 'ws';
import pty from 'node-pty';

export function attachTerminal(server) {
  const wss = new WebSocketServer({ server, path: '/terminal' });
  
  wss.on('connection', (ws) => {
    let ptyProcess;
    try {
      const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
      ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.cwd(),
        env: process.env
      });
    } catch (err) {
      console.error('[Terminal] Failed to spawn node-pty:', err);
      ws.send(`\r\n\x1b[31m[Erro do Servidor] Falha ao iniciar terminal local: ${err.message}\x1b[0m\r\n`);
      return;
    }

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
