import { spawn } from 'child_process';
import path from 'path';

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const electronCmd = isWindows ? 'electron.cmd' : 'electron';

console.log('[start-electron-dev] Building frontend assets...');
const build = spawn(npmCmd, ['run', 'build'], { stdio: 'inherit' });

build.on('close', (code) => {
  if (code !== 0) {
    console.error('[start-electron-dev] Build failed. Exiting.');
    process.exit(code);
  }

  console.log('[start-electron-dev] Launching Electron...');
  const electron = spawn(electronCmd, ['.'], { stdio: 'inherit' });

  electron.on('close', (elCode) => {
    process.exit(elCode);
  });
});
