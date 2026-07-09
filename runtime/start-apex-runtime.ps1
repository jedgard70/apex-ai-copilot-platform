param (
    [string]$ModelName = "apex-ai.gguf",
    [int]$Port = 1337,
    [int]$CtxSize = 2048,
    [int]$NGpuLayers = 33
)

$ErrorActionPreference = "Stop"

$ScriptPath = $MyInvocation.MyCommand.Path
$RuntimeDir = Split-Path $ScriptPath
$ExePath = Join-Path $RuntimeDir "apex-runtime.exe"
$ModelDir = Join-Path $RuntimeDir "models"
$ModelPath = Join-Path $ModelDir $ModelName

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "              APEX AI - OFFLINE RUNTIME                   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

if (-Not (Test-Path $ExePath)) {
    Write-Host "[ERRO CRITICO] O executavel apex-runtime.exe nao foi encontrado em:" -ForegroundColor Red
    Write-Host "  $ExePath" -ForegroundColor Red
    Write-Host "Certifique-se de baixar o runtime." -ForegroundColor Yellow
    exit 1
}

if (-Not (Test-Path $ModelPath)) {
    Write-Host "[ERRO CRITICO] O arquivo de modelo nao foi encontrado em:" -ForegroundColor Red
    Write-Host "  $ModelPath" -ForegroundColor Red
    Write-Host "Apos o Colab finalizar, baixe o arquivo 'apex-ai.gguf' e coloque-o na pasta 'runtime/models/'." -ForegroundColor Yellow
    exit 1
}

Write-Host "[INFO] Modelo Detectado: " -NoNewline -ForegroundColor Green
Write-Host $ModelPath -ForegroundColor Green
Write-Host "[INFO] Porta do Servidor: " -NoNewline -ForegroundColor Green
Write-Host $Port -ForegroundColor Green
Write-Host "[INFO] Tamanho de Contexto: " -NoNewline -ForegroundColor Green
Write-Host $CtxSize -ForegroundColor Green
Write-Host "[INFO] Camadas na GPU (VRAM): " -NoNewline -ForegroundColor Green
Write-Host $NGpuLayers -ForegroundColor Green
Write-Host ""
Write-Host "Inicializando motor de inferencia (llama-server)... Pressione CTRL+C para sair." -ForegroundColor Yellow
Write-Host "Para acessar a API OpenAI-compatible, use: http://127.0.0.1:$Port/v1" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Gray

& $ExePath -m $ModelPath -c $CtxSize --port $Port -ngl $NGpuLayers
