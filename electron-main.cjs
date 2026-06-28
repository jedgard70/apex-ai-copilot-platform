const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Apex AI Copilot Platform",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
  });
  
  // In Electron, we will load the Express server that serves our built frontend and API.
  mainWindow.loadURL('http://localhost:3333'); 
}

app.whenReady().then(() => {
  console.log("Iniciando Servidor Interno Apex AI...");
  
  // Start the backend server on port 3333
  serverProcess = spawn('node', [path.join(__dirname, 'server/server.mjs')], {
    env: { ...process.env, PORT: 3333, NODE_ENV: 'production' },
    stdio: 'inherit'
  });

  // Wait a moment for the Express server to start, then open the window
  setTimeout(() => {
    createWindow();
  }, 2500);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
