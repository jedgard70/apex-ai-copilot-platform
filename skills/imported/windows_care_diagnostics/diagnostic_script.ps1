# Windows Diagnostic & Care Script
# Created by Apex AI Copilot. Mode: READ ONLY / AUDIT ONLY.

function Start-ApexDiagnostics {
    [CmdletBinding()]
    param()

    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "  APEX WINDOWS DIAGNOSTIC & CARE ENGINE   " -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green

    # CPU, Memory, Disk diagnostics
    $cpu = Get-CimInstance Win32_Processor | Select-Object -ExpandProperty LoadPercentage
    $mem = Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory, TotalVisibleMemorySize
    $freeMemPct = ($mem.FreePhysicalMemory / $mem.TotalVisibleMemorySize) * 100

    Write-Host "System Performance Summary:"
    Write-Host "- CPU Usage: $cpu %"
    Write-Host "- Free RAM Percentage: [$([math]::Round($freeMemPct, 2))] %"

    # Disk status
    Get-Volume | Where-Object DriveLetter | ForEach-Object {
        Write-Host "- Drive $($_.DriveLetter): $([math]::Round($_.SizeRemaining / 1GB, 2)) GB free out of $([math]::Round($_.Size / 1GB, 2)) GB"
    }

    Write-Host "`nDiagnostics Completed. No changes were made to system settings." -ForegroundColor Yellow
}

Start-ApexDiagnostics
