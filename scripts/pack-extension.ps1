# Pack CRX for Android Edge sideload (run on Windows with desktop Edge)
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

# Stage only shippable files so dist/*.pem is never packed into the CRX
$stagingRoot = Join-Path $env:TEMP ("swipe-seek-pack-" + [guid]::NewGuid().ToString("n"))
$staging = Join-Path $stagingRoot "swipe-seek"
New-Item -ItemType Directory -Force -Path $staging | Out-Null

$include = @("manifest.json", "icons", "_locales", "src")
try {
  foreach ($item in $include) {
    $src = Join-Path $ExtensionDir $item
    if (-not (Test-Path $src)) {
      throw "Missing required path: $src"
    }
    Copy-Item -Path $src -Destination (Join-Path $staging $item) -Recurse -Force
  }

  $parentDir = $stagingRoot
  $leafName = "swipe-seek"
  $generatedCrx = Join-Path $parentDir ($leafName + ".crx")
  $generatedPem = Join-Path $parentDir ($leafName + ".pem")

  if (Test-Path $generatedCrx) { Remove-Item -Force $generatedCrx }
  if (Test-Path $generatedPem) { Remove-Item -Force $generatedPem -ErrorAction SilentlyContinue }

  if (Test-Path $keyPath) {
    & $edge "--pack-extension=$staging" "--pack-extension-key=$keyPath"
  } else {
    & $edge "--pack-extension=$staging"
  }

  if (-not (Test-Path $generatedCrx)) {
    throw "Pack failed: CRX not created. Check manifest.json"
  }

  Move-Item -Force $generatedCrx $crxOut
  if (Test-Path $generatedPem) {
    Move-Item -Force $generatedPem $keyPath
  }

  Write-Host "CRX: $crxOut"
  Write-Host "KEY: $keyPath"
}
finally {
  Remove-Item -Recurse -Force $stagingRoot -ErrorAction SilentlyContinue
}
