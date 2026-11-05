# One Button — deploy to hosting site one-button-jay (project canopy-website-ef7a8).
# spine.js here is a copy of the canonical ~/canopy-mycelial/public/shell/spine.js — re-copy before deploying.
$ErrorActionPreference='Continue'
Copy-Item "$env:USERPROFILE\canopy-mycelial\public\shell\spine.js" (Join-Path $PSScriptRoot 'spine.js') -Force
Push-Location $PSScriptRoot
firebase deploy --only hosting:one-button-jay --project canopy-website-ef7a8
$code=$LASTEXITCODE
Pop-Location
if($code -eq 0){ Write-Host 'LIVE: https://one-button-jay.web.app/' -ForegroundColor Green } else { Write-Host 'deploy failed' -ForegroundColor Yellow }
exit $code
