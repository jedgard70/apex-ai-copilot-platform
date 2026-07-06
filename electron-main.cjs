const { app, BrowserWindow, Tray, Menu, nativeImage, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
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

  const asarRoot = path.join(process.resourcesPath, "app.asar");
  if (fs.existsSync(path.join(asarRoot, "server.mjs"))) return asarRoot;

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

async function waitForServer(port, timeoutMs = 60000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isHttpReady(port, "/")) return true;
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

function startupHtml({ title = "Apex AI Copilot", message = "Iniciando plataforma local...", detail = "" } = {}) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07111f; color: #e5edf7; font-family: Inter, Segoe UI, Arial, sans-serif; }
          main { width: min(620px, calc(100vw - 48px)); border: 1px solid #22324a; background: #0d1b2f; padding: 28px; border-radius: 10px; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
          h1 { margin: 0 0 10px; font-size: 24px; }
          p { margin: 8px 0; color: #b8c4d6; line-height: 1.45; }
          code { color: #9dd3ff; }
        </style>
      </head>
      <body><main><h1>${title}</h1><p>${message}</p>${detail ? `<p><code>${detail}</code></p>` : ""}</main></body>
    </html>`)}`;
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
  const localExe = path.join(app.getPath("userData"), "..", "Apex AI", "engine", "llama-server.exe");
  if (!fs.existsSync(engineScript) || !fs.existsSync(localExe)) {
    log("[Apex] Motor próprio local não instalado. Usando inteligência Google Gemini Nativo.");
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
    show: true,
    center: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  mainWindow.focus();
  mainWindow.once('ready-to-show', () => {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('close', function () {
    app.isQuiting = true;
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

  if (initialPath === "__startup__") {
    mainWindow.loadURL(startupHtml());
  } else {
    mainWindow.loadURL(`http://127.0.0.1:${APP_PORT}${initialPath}`);
  }
}

// === Global error handlers ===
process.on('uncaughtException', (err) => {
  const msg = `[Apex] Erro nao capturado: ${err?.message || err}\n${err?.stack || ''}`;
  log(msg);
  try { dialog.showErrorBox('Apex AI - Erro Inesperado', `${err?.message || err}\n\nO aplicativo sera encerrado.\n\nLog: ${logPath()}`); } catch (_) { }
  app.quit();
});

process.on('unhandledRejection', (reason) => {
  log(`[Apex] Rejeicao nao tratada: ${reason?.message || reason || 'sem detalhes'}`);
});

app.whenReady().then(async () => {
  const appRoot = getAppRoot();
  const serverScript = path.join(appRoot, "server.mjs");
  log(`[Apex] Iniciando plataforma. packaged=${app.isPackaged} root=${appRoot}`);
  createWindow("__startup__");

  app.isQuiting = false;

  // Inicia motor de IA proprio em background (nao bloqueia)
  apexEngineProcess = startApexEngine(appRoot);

  // Setup auto updater
  autoUpdater.logger = {
    info(msg) { log(`[Updater:Info] ${msg}`); },
    warn(msg) { log(`[Updater:Warn] ${msg}`); },
    error(msg) { log(`[Updater:Error] ${msg}`); },
    debug(msg) { log(`[Updater:Debug] ${msg}`); }
  };
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on('update-available', () => log('[Updater] Atualizacao disponivel.'));
  autoUpdater.on('update-downloaded', () => {
    log('[Updater] Atualizacao baixada. Instalando em breve...');
    setTimeout(() => {
      autoUpdater.quitAndInstall(true, true);
    }, 5000);
  });

  // Inicia servidor Node.js na porta 3333
  if (!fs.existsSync(serverScript)) {
    log(`[Apex] server.mjs nao encontrado em ${serverScript}`);
    if (mainWindow) {
      mainWindow.loadURL(startupHtml({
        title: "Apex AI Copilot",
        message: "Servidor local não foi encontrado no pacote. Abrindo a versão web de produção.",
        detail: "fallback=https://www.apexglobalai.com",
      }));
      mainWindow.show();
      setTimeout(() => mainWindow?.loadURL("https://www.apexglobalai.com"), 1800);
    }
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
  if (mainWindow) {
    if (ready) {
      mainWindow.loadURL(`http://127.0.0.1:${APP_PORT}/`);
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.setAlwaysOnTop(true);
      mainWindow.setAlwaysOnTop(false);
    } else {
      mainWindow.loadURL(startupHtml({
        title: "Erro ao Iniciar o Servidor Local",
        message: "O servidor da plataforma demorou muito para responder (timeout de 60s). Isso pode ocorrer se alguma porta (3333, 8888) já estiver em uso, se houver um erro no código-fonte, ou se as permissões estiverem bloqueando a execução.",
        detail: `Por favor, verifique o arquivo de log em: ${logPath()}`,
      }));
      mainWindow.show(); // garante que o usuario veja a msg de erro
      // setTimeout(() => mainWindow?.loadURL("https://www.apexglobalai.com"), 2200);
    }
  }

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
