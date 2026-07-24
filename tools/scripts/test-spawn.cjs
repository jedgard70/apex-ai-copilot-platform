const { spawn } = require('child_process');
const path = require('path');
const execPath = "C:\\Users\\apexg\\AppData\\Local\\Programs\\Apex AI Copilot\\Apex AI Copilot.exe";
const serverScript = "C:\\Users\\apexg\\AppData\\Local\\Programs\\Apex AI Copilot\\resources\\app.asar\\server.mjs";

console.log("Spawning...");
const child = spawn(execPath, [serverScript], {
  cwd: path.dirname(execPath),
  windowsHide: true,
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1"
  }
});

child.on('error', err => console.error("Error:", err));
child.on('close', code => console.log("Close:", code));
child.stdout.on('data', d => console.log("STDOUT:", d.toString()));
child.stderr.on('data', d => console.log("STDERR:", d.toString()));
