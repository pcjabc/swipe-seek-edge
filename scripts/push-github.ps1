# Push to GitHub (run locally when github.com is reachable)
param(
  [string]$RepoName = "swipe-seek-edge",
  [string]$Visibility = "public"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
  throw "Install GitHub CLI first: winget install GitHub.cli"
}

gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Login required:"
  gh auth login -h github.com -p https -w
}

$owner = (gh api user -q .login)
$remote = "https://github.com/$owner/$RepoName.git"

if (-not (git remote get-url origin 2>$null)) {
  gh repo create $RepoName --$Visibility --source=. --remote=origin --push
  Write-Host "Created and pushed: https://github.com/$owner/$RepoName"
  exit 0
}

git push -u origin main
Write-Host "Pushed: https://github.com/$owner/$RepoName"
