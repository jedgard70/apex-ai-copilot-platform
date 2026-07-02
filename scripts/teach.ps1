# ═══════════════════════════════════════════════════════════════════
# APEX AI — Script de Ensino (PowerShell)
# Para o Dr. Edgard ensinar a Apex AI sem precisar de curl
#
# USO BÁSICO (copie e cole no PowerShell):
#
#   # Ensinar um fato:
#   .\scripts\teach.ps1 -Tipo ensinar -Topico "preco_basico" -Conteudo "Plano Básico custa R$297/mês"
#
#   # Ver o que a AI já sabe:
#   .\scripts\teach.ps1 -Tipo ver
#
#   # Treinar o modelo com tudo:
#   .\scripts\teach.ps1 -Tipo treinar
#
#   # Confirmar que uma skill está funcionando:
#   .\scripts\teach.ps1 -Tipo skill -Topico "budget_studio" -Conteudo "Budget Studio LIVE"
# ═══════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("ensinar", "ver", "treinar", "skill", "servico", "pesquisa", "comando")]
    [string]$Tipo = "ver",

    [Parameter(Mandatory=$false)]
    [string]$Topico = "",

    [Parameter(Mandatory=$false)]
    [string]$Conteudo = ""
)

# ─── Configuração ──────────────────────────────────────────────────────────────
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir   = Split-Path -Parent $ScriptDir
$EnvFile   = Join-Path $RootDir ".env.local"

# Lê o CRON_SECRET do .env.local automaticamente
$Token = ""
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match "^CRON_SECRET=(.+)$") { $Token = $Matches[1].Trim() }
        if ($_ -match "^APEX_OWNER_KEY=(.+)$" -and $Token -eq "") { $Token = $Matches[1].Trim() }
        if ($_ -match "^LOCAL_WORKER_TOKEN=(.+)$" -and $Token -eq "") { $Token = $Matches[1].Trim() }
    }
}

if ($Token -eq "") {
    Write-Host "⚠️  Token não encontrado no .env.local" -ForegroundColor Yellow
    Write-Host "   Crie CRON_SECRET=sua-chave no arquivo .env.local" -ForegroundColor Yellow
    exit 1
}

# URL base — tenta local primeiro, depois produção
$LocalUrl = "http://localhost:3333"
$ProdUrl  = "https://www.apexglobalai.com"
$BaseUrl  = $ProdUrl

# Testa se servidor local está rodando
try {
    $test = Invoke-WebRequest -Uri "$LocalUrl/api/copilot/chat?ping=1" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($test.StatusCode -lt 500) { $BaseUrl = $LocalUrl }
} catch {}

$Endpoint = "$BaseUrl/api/copilot/teach"

# ─── Funções auxiliares ────────────────────────────────────────────────────────
function Invocar-API($Body) {
    $Json = $Body | ConvertTo-Json -Depth 5
    try {
        $Response = Invoke-RestMethod `
            -Uri $Endpoint `
            -Method POST `
            -Headers @{ Authorization = "Bearer $Token"; "Content-Type" = "application/json" } `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($Json)) `
            -ErrorAction Stop
        return $Response
    } catch {
        Write-Host "❌ Erro na API: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   URL: $Endpoint" -ForegroundColor Gray
        return $null
    }
}

function Ver-Memoria() {
    Write-Host "`n📚 Carregando memória da Apex AI..." -ForegroundColor Cyan
    try {
        $Response = Invoke-RestMethod `
            -Uri $Endpoint `
            -Method GET `
            -Headers @{ Authorization = "Bearer $Token" } `
            -ErrorAction Stop

        Write-Host "`n📊 Resumo da memória:" -ForegroundColor Green
        Write-Host "   Ensinamentos:        $($Response.summary.teachings)"
        Write-Host "   Pesquisas salvas:    $($Response.summary.researchKnowledge)"
        Write-Host "   Skills confirmadas:  $($Response.summary.confirmedSkills)"
        Write-Host "   Conversas salvas:    $($Response.summary.qualityConversations)"
        Write-Host "   Última atualização:  $($Response.summary.updatedAt)"

        if ($Response.teachings -and $Response.teachings.Count -gt 0) {
            Write-Host "`n🧠 Últimos ensinamentos:" -ForegroundColor Yellow
            $Response.teachings | Select-Object -Last 10 | ForEach-Object {
                Write-Host "   [$($_.topic)]: $($_.content)" -ForegroundColor White
            }
        }
    } catch {
        Write-Host "❌ Não foi possível carregar a memória: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ─── Lógica principal ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     APEX AI — PAINEL DE ENSINO           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "  Conectado em: $BaseUrl" -ForegroundColor Gray
Write-Host ""

switch ($Tipo) {

    "ver" {
        Ver-Memoria
    }

    "ensinar" {
        if ($Topico -eq "" -or $Conteudo -eq "") {
            Write-Host "❌ Use: -Topico 'nome_do_assunto' -Conteudo 'o que a AI deve saber'" -ForegroundColor Red
            Write-Host "   Exemplo: .\scripts\teach.ps1 -Tipo ensinar -Topico 'preco' -Conteudo 'Plano Básico R$297/mês'"
            exit 1
        }
        Write-Host "✏️  Ensinando: [$Topico] → $Conteudo" -ForegroundColor Yellow
        $r = Invocar-API @{ type = "teaching"; topic = $Topico; content = $Conteudo }
        if ($r) {
            Write-Host "✅ Ensinamento salvo!" -ForegroundColor Green
            Write-Host "   Execute 'npm run train' para aplicar ao modelo." -ForegroundColor Gray
        }
    }

    "skill" {
        if ($Topico -eq "") {
            Write-Host "❌ Use: -Topico 'nome_da_skill' -Conteudo 'descrição (opcional)'" -ForegroundColor Red
            exit 1
        }
        $desc = if ($Conteudo -ne "") { $Conteudo } else { $Topico }
        Write-Host "⚡ Confirmando skill live: $Topico" -ForegroundColor Yellow
        $r = Invocar-API @{ type = "skill"; topic = $Topico; content = $desc }
        if ($r) { Write-Host "✅ Skill '$Topico' confirmada como LIVE!" -ForegroundColor Green }
    }

    "servico" {
        if ($Conteudo -eq "") {
            Write-Host "❌ Use: -Conteudo 'descrição do serviço'" -ForegroundColor Red
            exit 1
        }
        Write-Host "💼 Adicionando serviço: $Conteudo" -ForegroundColor Yellow
        $r = Invocar-API @{ type = "business"; topic = "services"; content = $Conteudo }
        if ($r) { Write-Host "✅ Serviço adicionado!" -ForegroundColor Green }
    }

    "pesquisa" {
        if ($Topico -eq "" -or $Conteudo -eq "") {
            Write-Host "❌ Use: -Topico 'tema pesquisado' -Conteudo 'resumo do que encontrou'" -ForegroundColor Red
            exit 1
        }
        Write-Host "🔍 Salvando pesquisa: $Topico" -ForegroundColor Yellow
        $r = Invocar-API @{ type = "research"; topic = $Topico; content = $Conteudo }
        if ($r) { Write-Host "✅ Pesquisa memorizada!" -ForegroundColor Green }
    }

    "treinar" {
        Write-Host "🔄 Iniciando treino do modelo Apex AI..." -ForegroundColor Cyan
        Write-Host "   (Isso pode levar 1-2 minutos)" -ForegroundColor Gray
        $r = Invocar-API @{ type = "retrain" }
        if ($r -and $r.ok) {
            Write-Host "✅ Modelo apex-ai atualizado com sucesso!" -ForegroundColor Green
        } elseif ($r) {
            Write-Host "⚠️  Treino executado (verifique se Ollama está rodando)" -ForegroundColor Yellow
        }
    }

    "comando" {
        if ($Conteudo -eq "") {
            Write-Host "❌ Use: -Conteudo 'comando permitido'" -ForegroundColor Red
            exit 1
        }
        Write-Host "⚡ Autorizando comando para clientes: $Conteudo" -ForegroundColor Yellow
        $r = Invocar-API @{ type = "command"; content = $Conteudo }
        if ($r) { Write-Host "✅ Comando autorizado!" -ForegroundColor Green }
    }
}

Write-Host ""
