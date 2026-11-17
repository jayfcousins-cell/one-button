# Stamps version.json: when the page last changed (now) and the newest Android build.
# Called by deploy.ps1 before every deploy. The page polls this file to offer an update.
$ErrorActionPreference='Continue'
$android=0
try { $name = gh release view latest -R jayfcousins-cell/one-button-android --json name --jq .name 2>$null; if ($name -match 'build (\d+)') { $android = [int]$Matches[1] } } catch {}
$old = Join-Path $PSScriptRoot 'version.json'
if ($android -eq 0 -and (Test-Path $old)) { try { $android = (Get-Content $old -Raw | ConvertFrom-Json).android } catch {} }
# Only web, android and apk change; everything else (the What's new notes) is kept.
python -c "import json,sys,datetime;p=sys.argv[1];v=json.load(open(p,encoding='utf-8-sig'));v['web']=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ');v['android']=int(sys.argv[2]);v['apk']='https://github.com/jayfcousins-cell/one-button-android/releases/latest/download/one-button.apk';json.dump(v,open(p,'w',encoding='utf-8'),separators=(',',':'));print('version.json: web',v['web'],'android build',v['android'],'notes',len(v.get('notes',[])))" $old $android
