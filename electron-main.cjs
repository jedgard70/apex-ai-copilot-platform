const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");

let mainWindow;
let serverProcess;
let apexEngineProcess;

const APEX_ENGINE_PORT = 11435;
const APP_PORT = 3333;

function getAppRoot() {
  if (!app.isPackaged) return __dirname;

  const unpackedRoot = path.join(process.resourcesPath, "app.asar.unpacked");
  if (fs.existsSync(path.join(unpackedRoot, "server.mjs"))) return unpackedRoot;

  const resourcesRoot = process.resourcesPath;
  if (fs.existsSync(path.join(resourcesRoot, "server.mjs"))) return resourcesRoot;

  return __dirname;
}

function logPath() {
  return path.join(app.getPath("userData"), "apex-electron.log");
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  try {
    fs.mkdirSync(app.getPath("userData"), { recursive: true });
    fs.appendFileSync(logPath(), `${line}\n`, "utf8");
  } catch (_) { }
}

function isHttpReady(port, pathname = "/") {
  return new Promise(resolve => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path: pathname, method: "GET" },
      res => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      }
    );
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => { req.destroy(); resolve(false); });
    req.end();
  });
}

async function waitForServer(port, timeoutMs = 45000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isHttpReady(port, "/api/copilot/chat")) return true;
    await new Promise(resolve => setTimeout(resolve, 750));
  }
  return false;
}

function buildNodeChildEnv(extra = {}) {
  return {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    ...extra,
  };
}

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

// Inicia o motor de IA proprio da Apex
function startApexEngine(appRoot) {
  const engineScript = path.join(appRoot, "server", "apex-runtime", "api-server.mjs");
  if (!fs.existsSync(engineScript)) {
    log("[Apex] Motor proprio nao encontrado. Chat usara Gemini API.");
    return null;
  }
  log("[Apex] Iniciando motor de IA proprio...");
  const proc = spawn(process.execPath, [engineScript], {
    cwd: appRoot,
    windowsHide: true,
    stdio: "pipe",
    env: buildNodeChildEnv({ APEX_ENGINE_PORT: String(APEX_ENGINE_PORT), APEX_API_PORT: "8888" }),
  });
  proc.stdout.on("data", d => { const m = d.toString().trim(); if (m) log(`[engine] ${m.slice(0, 300)}`); });
  proc.stderr.on("data", d => { const m = d.toString().trim(); if (m && !m.includes("Warning")) log(`[engine] ${m.slice(0, 300)}`); });
  proc.on("close", code => { log(`[Apex] Motor encerrado: ${code}`); apexEngineProcess = null; });
  proc.on("error", err => { log(`[Apex] Erro no motor: ${err.message}`); apexEngineProcess = null; });
  return proc;
}

function createWindow(initialPath = "/") {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    title: "Apex AI Copilot Platform",
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    log(`[Apex] Bloqueada tentativa de abrir nova janela: ${url}`);
    return { action: "deny" };
  });
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    log(`[Apex] Falha ao carregar renderer: ${errorCode} ${errorDescription} ${validatedURL}`);
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    log(`[Apex] Renderer encerrado: reason=${details.reason} exitCode=${details.exitCode}`);
  });
  mainWindow.on("unresponsive", () => {
    log("[Apex] Janela Electron ficou sem resposta.");
  });

  mainWindow.loadURL(`http://127.0.0.1:${APP_PORT}${initialPath}`);
}

app.whenReady().then(async () => {
  const appRoot = getAppRoot();
  const serverScript = path.join(appRoot, "server.mjs");
  log(`[Apex] Iniciando plataforma. packaged=${app.isPackaged} root=${appRoot}`);

  // Inicia motor de IA proprio em background (nao bloqueia)
  apexEngineProcess = startApexEngine(appRoot);

  // Inicia servidor Node.js na porta 3333
  if (!fs.existsSync(serverScript)) {
    log(`[Apex] server.mjs nao encontrado em ${serverScript}`);
    createWindow("/?startupError=server-not-found");
    return;
  }

  serverProcess = spawn(process.execPath, [serverScript], {
    cwd: appRoot,
    windowsHide: true,
    env: {
      ...buildNodeChildEnv(),
      PORT: String(APP_PORT),
      NODE_ENV: "production",
      // Motor proprio Apex
      APEX_OWN_ENGINE_URL: "http://127.0.0.1:8888",
      APEX_API_URL: "http://127.0.0.1:8888",
      APEX_RUNTIME_ENABLED: "true",
      LOCAL_WORKER_URL: "http://127.0.0.1:8787",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverProcess.stdout.on("data", d => { const m = d.toString().trim(); if (m) log(`[server] ${m.slice(0, 500)}`); });
  serverProcess.stderr.on("data", d => { const m = d.toString().trim(); if (m) log(`[server:error] ${m.slice(0, 800)}`); });
  serverProcess.on("error", err => log(`[Apex] Server error: ${err.message}`));
  serverProcess.on("close", code => {
    log(`[Apex] Server encerrado: ${code}`);
    serverProcess = null;
  });

  const ready = await waitForServer(APP_PORT);
  if (!ready) {
    log(`[Apex] Server nao respondeu em http://127.0.0.1:${APP_PORT} dentro do timeout.`);
  }
  createWindow(ready ? "/" : "/?startupError=server-timeout");

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
  log("[Apex] Encerrado.");
});
