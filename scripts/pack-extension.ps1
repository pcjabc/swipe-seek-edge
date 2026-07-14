# Pack CRX for Android Edge sideload (run on Windows with desktop Edge)
# Uses an ASCII staging path because Edge --pack-extension fails on non-ASCII paths.
param(
  [string]$ExtensionDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$OutDir = (Join-Path (Join-Path $PSScriptRoot "..") "dist")
)

$ErrorActionPreference = "Stop"

$edgeCandidates = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)

$edge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) {
  throw "msedge.exe not found. Install desktop Microsoft Edge."
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$keyPath = Join-Path $OutDir "extension.pem"
$crxOut = Join-Path $OutDir "swipe-seek.crx"
$asciiRoot = Join-Path $env:TEMP "swipe-seek-pack"
$staging = Join-Path $asciiRoot "ext"
$asciiKey = Join-Path $asciiRoot "extension.pem"

if (Test-Path $asciiRoot) {
  Remove-Item -Recurse -Force $asciiRoot
}
New-Item -ItemType Directory -Force -Path $staging | Out-Null

$include = @("manifest.json", "icons", "_locales", "src")
foreach ($item in $include) {
  $src = Join-Path $ExtensionDir $item
  if (-not (Test-Path $src)) {
    throw "Missing required path: $src"
  }
  Copy-Item -Path $src -Destination (Join-Path $staging $item) -Recurse -Force
}

if (Test-Path $keyPath) {
  Copy-Item -Force $keyPath $asciiKey
}

$generatedCrx = Join-Path $asciiRoot "ext.crx"
$generatedPem = Join-Path $asciiRoot "ext.pem"
if (Test-Path $generatedCrx) { Remove-Item -Force $generatedCrx }

if (Test-Path $asciiKey) {
  & $edge "--pack-extension=$staging" "--pack-extension-key=$asciiKey"
} else {
  & $edge "--pack-extension=$staging"
}

Start-Sleep -Seconds 1

if (-not (Test-Path $generatedCrx)) {
  throw "Pack failed: CRX not created."
}

Move-Item -Force $generatedCrx $crxOut
if ((-not (Test-Path $keyPath)) -and (Test-Path $generatedPem)) {
  Move-Item -Force $generatedPem $keyPath
}

Copy-Item -Force $crxOut (Join-Path $ExtensionDir "release\swipe-seek.crx")
Remove-Item -Recurse -Force $asciiRoot -ErrorAction SilentlyContinue

Write-Host "CRX: $crxOut"
Write-Host "Release: $(Join-Path $ExtensionDir 'release\swipe-seek.crx')"
