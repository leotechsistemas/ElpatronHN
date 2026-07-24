$env:JWT_SECRET="dev-secret-123"
Write-Host "Iniciando servidores..."

# Kill existing processes on ports
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Id (Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Id (Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep 1

# Start API
$api = Start-Process -PassThru -FilePath "node" -ArgumentList "server/index.cjs" -NoNewWindow -RedirectStandardOutput "api.log" -RedirectStandardError "api-err.log"
Write-Host "API PID: $($api.Id)"

Start-Sleep 2

# Start Vite
$vite = Start-Process -PassThru -FilePath "npx" -ArgumentList "vite --port=3002 --host=0.0.0.0" -NoNewWindow -RedirectStandardOutput "vite.log" -RedirectStandardError "vite-err.log"
Write-Host "Vite PID: $($vite.Id)"

Start-Sleep 5

# Verify
$apiCheck = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
$viteCheck = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue

if (-not $apiCheck) { Write-Host "API no inició. Log:"; Get-Content "api.log" -Tail 5; Get-Content "api-err.log" -Tail 5; exit 1 }
if (-not $viteCheck) { Write-Host "Vite no inició. Log:"; Get-Content "vite.log" -Tail 5; Get-Content "vite-err.log" -Tail 5; exit 1 }

Write-Host "Servidores OK!"
Write-Host "API: http://localhost:3001"
Write-Host "App: http://localhost:3002"

Write-Host ""
Write-Host "Iniciando localtunnel en puerto 3002..."
Write-Host "Esperando URL pública..."
npx localtunnel --port 3002 --subdomain elpatron-hn 2>&1

# Cleanup on exit
$api.Kill(); $vite.Kill()
