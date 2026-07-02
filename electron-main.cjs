const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");

let mainWindow;
let serverProcess;
let apexEngineProcess;

const APEX_ENGINE_PORT = 11435;

// Verifica se o motor proprio esta rodando
function isEngineReady() {
  return new Promise(resolve => {
    const req = http.request(
      { hostname: "127.0.0.1", port: APEX_ENGINE_PORT, path: "/health", method: "GET" },
      res => resolve(res.statusCode === 200)
    );
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => { req.destroy(); resolve(false); });
    req.end();
  });
}

// Inicia o motor de IA proprio da Apex (sem Ollama)
function startApexEngine() {
  const engineScript = path.join(__dirname, "server", "apex-runtime", "api-server.mjs");
  if (!fs.existsSync(engineScript)) {
    console.log("[Apex] Motor proprio nao encontrado. Chat usara Gemini API.");
    return null;
  }
  console.log("[Apex] Iniciando motor de IA proprio...");
  const proc = spawn(process.execPath, [engineScript], {
    windowsHide: true,
    stdio: "pipe",
    env: { ...process.env, APEX_ENGINE_PORT: String(APEX_ENGINE_PORT), APEX_API_PORT: "8888" },
  });
  proc.stdout.on("data", d => { const m = d.toString().trim(); if (m) console.log("[engine]", m.slice(0, 200)); });
  proc.stderr.on("data", d => { const m = d.toString().trim(); if (m && !m.includes("Warning")) console.log("[engine]", m.slice(0, 200)); });
  proc.on("close", code => { console.log("[Apex] Motor encerrado:", code); apexEngineProcess = null; });
  proc.on("error", err => { console.log("[Apex] Erro no motor:", err.message); apexEngineProcess = null; });
  return proc;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    title: "Apex AI Copilot Platform",
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  mainWindow.loadURL("http://localhost:3333");
}

app.whenReady().then(() => {
  console.log("[Apex] Iniciando plataforma...");

  // Inicia motor de IA proprio em background (nao bloqueia)
  apexEngineProcess = startApexEngine();

  // Inicia servidor Node.js na porta 3333
  serverProcess = spawn(process.execPath, [path.join(__dirname, "server.mjs")], {
    env: {
      ...process.env,
      PORT: "3333",
      NODE_ENV: "production",
      // Motor proprio na porta 11435
      APEX_LOCAL_URL: "http://127.0.0.1:11435",
      APEX_RUNTIME_ENABLED: "true",
      LOCAL_WORKER_URL: "http://127.0.0.1:8787",
    },
    stdio: "inherit",
  });
  serverProcess.on("error", err => console.error("[Apex] Server error:", err.message));

  // Abre janela apos 2.5s
  setTimeout(createWindow, 2500);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("quit", () => {
  if (serverProcess) { try { serverProcess.kill(); } catch (_) { } }
  if (apexEngineProcess) { try { apexEngineProcess.kill(); } catch (_) { } }
  console.log("[Apex] Encerrado.");
});
