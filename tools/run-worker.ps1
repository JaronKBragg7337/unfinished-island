$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
Set-Location ..
New-Item -ItemType Directory -Path '.runtime' -Force | Out-Null
$workerLog = Join-Path (Get-Location) '.runtime/worker.log'
try {
    & git pull --ff-only 2>&1 | Out-File -LiteralPath $workerLog -Append
    if ($LASTEXITCODE -ne 0) { throw 'Unable to update worker checkout' }
    & node tools/cycle.mjs --publish 2>&1 | Out-File -LiteralPath $workerLog -Append
    if ($LASTEXITCODE -ne 0) { throw 'Cycle failed; inspect worker log' }
} catch {
    "$(Get-Date -Format o) $_" | Out-File -LiteralPath $workerLog -Append
    exit 1
}
