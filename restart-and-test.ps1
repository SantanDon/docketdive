# Restart server and test context awareness

Write-Host "🔄 Killing existing Next.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node.exe*" } | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "✅ Starting development server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

Write-Host "⏳ Waiting for server to start (15 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host "🧪 Running context awareness test..." -ForegroundColor Magenta
npx tsx test/context-awareness-test.ts

Write-Host "`n✨ Test complete! Check the results above." -ForegroundColor Green
