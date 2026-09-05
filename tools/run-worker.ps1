$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
Set-Location ..
New-Item -ItemType Directory -Path '.runtime' -Force | Out-Null
$workerLog = Join-Path (Get-Location) '.runtime/worker.log'
try {
    $pullProcess = Start-Process -FilePath 'git.exe' -ArgumentList 'pull','--ff-only' -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput '.runtime/pull.out.log' -RedirectStandardError '.runtime/pull.err.log'
    if ($pullProcess.ExitCode -ne 0) { throw 'Unable to update worker checkout' }
    $cycleProcess = Start-Process -FilePath 'node.exe' -ArgumentList 'tools/cycle.mjs','--publish' -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput '.runtime/cycle.out.log' -RedirectStandardError '.runtime/cycle.err.log'
    Get-Content '.runtime/cycle.out.log','.runtime/cycle.err.log' | Out-File -LiteralPath $workerLog -Append
    if ($cycleProcess.ExitCode -ne 0) { throw 'Cycle failed; inspect worker log' }
} catch {
    "$(Get-Date -Format o) $_" | Out-File -LiteralPath $workerLog -Append
    exit 1
}
