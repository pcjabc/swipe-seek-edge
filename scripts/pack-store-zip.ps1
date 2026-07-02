# Create store submission zip (exclude dev artifacts)
param(
  [string]$ExtensionDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$OutDir = (Join-Path (Join-Path $PSScriptRoot "..") "dist")
)

$ErrorActionPreference = "Stop"

$include = @(
  "manifest.json",
  "icons",
  "_locales",
  "src"
)

$excludeNames = @(
  ".git",
  "dist",
  "test",
  "docs",
  "scripts",
  "node_modules",
  ".DS_Store",
  "Thumbs.db"
)

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$zipPath = Join-Path $OutDir "store-package.zip"
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

$staging = Join-Path $env:TEMP ("swipe-seek-store-" + [guid]::NewGuid().ToString("n"))
New-Item -ItemType Directory -Force -Path $staging | Out-Null

try {
  foreach ($item in $include) {
    $src = Join-Path $ExtensionDir $item
    if (-not (Test-Path $src)) {
      throw "Missing required path: $src"
    }
    Copy-Item -Path $src -Destination (Join-Path $staging $item) -Recurse -Force
  }

  Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force
  Write-Host "Store package: $zipPath"
  Write-Host "Upload this zip to Partner Center (not the .crx file)."
}
finally {
  Remove-Item -Recurse -Force $staging -ErrorAction SilentlyContinue
}
