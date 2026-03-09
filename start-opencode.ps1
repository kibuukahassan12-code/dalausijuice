$LogFile = "$PSScriptRoot\opencode-log.txt"

# Optional: clear old logs
if (Test-Path $LogFile) { Remove-Item $LogFile -Force }

Write-Host "Starting OpenCode server locally..."

# Run OpenCode from local node_modules
Start-Process -NoNewWindow -FilePath "node" `
    -ArgumentList "`"$PSScriptRoot\node_modules\opencode-ai\bin\opencode`" start --server --host 127.0.0.1 --port 42736 --verbose" `
    -RedirectStandardOutput "$LogFile.out" -RedirectStandardError "$LogFile.err"

Write-Host "OpenCode server launched. Logs:"
Write-Host "  STDOUT -> $PSScriptRoot\opencode-log.txt.out"
Write-Host "  STDERR -> $PSScriptRoot\opencode-log.txt.err"
