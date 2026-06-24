# apex-diag.ps1 — Diagnóstico de Desempenho Windows (somente leitura)
# Modo: Auditoria — não modifica absolutamente nada
# Uso: Execute como Administrador no PowerShell
#
# Para executar:
#   1. Abra o PowerShell como Administrador
#   2. Navegue até a pasta: cd D:\AI-constr\apex-ai-copilot-platform
#   3. Execute: .\scripts\apex-diag.ps1
#   4. O relatório será salvo em: D:\AI-constr\apex-ai-copilot-platform\apex-diag-report.txt

$outputPath = Join-Path (Get-Location).Path "apex-diag-report.txt"
$report = @"

╔══════════════════════════════════════════════════════════════╗
║         APEX AI COPILOT — DIAGNÓSTICO WINDOWS              ║
║         Modo: Auditoria (sem modificação)                   ║
╚══════════════════════════════════════════════════════════════╝
Data:        $(Get-Date -Format 'dd/MM/yyyy HH:mm')
Computador:  $env:COMPUTERNAME
Usuário:     $env:USERNAME
"@

Write-Host "Coletando informações do sistema..." -ForegroundColor Cyan

# ─── 1. SISTEMA E UPTIME ───────────────────────────────────────
Write-Host "  [1/7] Sistema e Uptime..." -ForegroundColor Gray
$os = Get-CimInstance Win32_OperatingSystem
$uptime = (Get-Date) - $os.LastBootUpTime
$report += @"

────────────────────────────────────────────────────────────────
1. SISTEMA OPERACIONAL
────────────────────────────────────────────────────────────────
Versão:        $($os.Caption) Build $($os.BuildNumber)
Arquitetura:   $($os.OSArchitecture)
Uptime:        $($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m
Última boot:   $($os.LastBootUpTime)
"@

# ─── 2. CPU ────────────────────────────────────────────────────
Write-Host "  [2/7] CPU..." -ForegroundColor Gray
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$cpuLoad = [math]::Round((Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average, 1)
$report += @"

────────────────────────────────────────────────────────────────
2. CPU
────────────────────────────────────────────────────────────────
Modelo:        $($cpu.Name)
Núcleos:       $($cpu.NumberOfCores) físicos / $($cpu.NumberOfLogicalProcessors) lógicos
Clock:         $([math]::Round($cpu.MaxClockSpeed/1000,2)) GHz
Uso atual:     $cpuLoad%
"@

# ─── 3. MEMÓRIA RAM ────────────────────────────────────────────
Write-Host "  [3/7] Memória RAM..." -ForegroundColor Gray
$totalGB = [math]::Round($os.TotalVisibleMemorySize/1MB, 1)
$freeGB = [math]::Round($os.FreePhysicalMemory/1MB, 1)
$usedGB = [math]::Round($totalGB - $freeGB, 1)
$pctMem = [math]::Round(($usedGB/$totalGB)*100, 1)
$report += @"

────────────────────────────────────────────────────────────────
3. MEMÓRIA RAM
────────────────────────────────────────────────────────────────
Total:         $totalGB GB
Em uso:        $usedGB GB ($pctMem%)
Disponível:    $freeGB GB
"@

# ─── 4. DISCO ──────────────────────────────────────────────────
Write-Host "  [4/7] Discos..." -ForegroundColor Gray
$disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
$report += @"

────────────────────────────────────────────────────────────────
4. DISCOS (C:/D:/etc)
────────────────────────────────────────────────────────────────
"@
foreach ($d in $disks) {
    $dTotal = [math]::Round($d.Size/1GB, 1)
    $dFree = [math]::Round($d.FreeSpace/1GB, 1)
    $dUsed = [math]::Round($dTotal - $dFree, 1)
    $dPct = [math]::Round(($dUsed/$dTotal)*100, 1)
    $report += "Drive $($d.DeviceID): $dTotal GB total, $dUsed GB usados ($dPct%), $dFree GB livres`n"
}

# Disks performance
$diskPerf = Get-CimInstance Win32_PerfFormattedData_PerfDisk_LogicalDisk | Where-Object Name -notlike '_*' | Sort-Object Name
$report += "`n--- Performance de Disco (média recente) ---`n"
foreach ($dp in $diskPerf) {
    if ($dp.AvgDiskQueueLength -gt 0) {
        $report += "$($dp.Name): fila $($dp.AvgDiskQueueLength) | leituras/s $($dp.DiskReadsPerSec) | escritas/s $($dp.DiskWritesPerSec) | tempo % $($dp.PercentDiskTime)%`n"
    }
}

# ─── 5. TOP PROCESSOS ──────────────────────────────────────────
Write-Host "  [5/7] Top processos..." -ForegroundColor Gray
$report += @"

────────────────────────────────────────────────────────────────
5. TOP 15 PROCESSOS POR CONSUMO DE RAM
────────────────────────────────────────────────────────────────
"@
$topProcs = Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 15
foreach ($p in $topProcs) {
    $mb = [math]::Round($p.WorkingSet64 / 1MB, 1)
    $report += "{0,-30} {1,8} MB (PID {2})`n" -f ($p.ProcessName.Substring(0, [Math]::Min($p.ProcessName.Length, 30))), $mb, $p.Id
}

# ─── 6. SERVIÇOS CRÍTICOS ──────────────────────────────────────
Write-Host "  [6/7] Serviços..." -ForegroundColor Gray
$report += @"

────────────────────────────────────────────────────────────────
6. STATUS DE SERVIÇOS IMPORTANTES
────────────────────────────────────────────────────────────────
"@
$importantServices = @('WSearch', 'wuauserv', 'Spooler', 'MpsSvc', 'Dnscache', 'DHCP', 'Winmgmt')
foreach ($svc in $importantServices) {
    $s = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($s) {
        $report += "$svc`: $($s.Status)$(if ($s.StartType -eq 'Disabled') { ' (DESABILITADO!)' } else { '' })`n"
    }
}

# ─── 7. INICIALIZAÇÃO ──────────────────────────────────────────
Write-Host "  [7/7] Inicialização..." -ForegroundColor Gray
$report += @"

────────────────────────────────────────────────────────────────
7. PROGRAMAS DE INICIALIZAÇÃO (Startup)
────────────────────────────────────────────────────────────────
"@
$startup = Get-CimInstance Win32_StartupCommand | Sort-Object Name
if ($startup) {
    foreach ($s in $startup) {
        $report += "$($s.Name) — $($s.Command)$(if ($s.User) { " (Usuário: $($s.User))" })`n"
    }
} else {
    $report += "Nenhum programa de inicialização encontrado.`n"
}

# ─── FINALIZAÇÃO ───────────────────────────────────────────────
$report += @"

────────────────────────────────────────────────────────────────
Fim do diagnóstico — nenhuma modificação foi feita.
Relatório salvo em: $outputPath
────────────────────────────────────────────────────────────────
"@

$report | Out-File -FilePath $outputPath -Encoding utf8
Write-Host "`n✅ Diagnóstico completo!" -ForegroundColor Green
Write-Host "📄 Relatório salvo em: $outputPath" -ForegroundColor Yellow
Write-Host ""
Write-Host $report
