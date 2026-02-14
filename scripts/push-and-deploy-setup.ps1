# Push repo to GitHub and prepare for Fly.io + Cloudflare deployment
# Usage: .\scripts\push-and-deploy-setup.ps1 [org-or-username]
# Example: .\scripts\push-and-deploy-setup.ps1 waypointlabs

param([string]$RepoOwner = "")

$ErrorActionPreference = "Stop"
$repoName = "civilian-drone-app"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
Set-Location $rootDir

Write-Host ""
Write-Host "=== JARVIS AI - Push to GitHub and Deploy Setup ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "GitHub CLI (gh) is not installed. Install from: https://cli.github.com/" -ForegroundColor Yellow
  Write-Host "Or create the repo manually at https://github.com/new?name=$repoName" -ForegroundColor Yellow
  exit 1
}

$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Logging into GitHub (browser will open)..." -ForegroundColor Yellow
  gh auth login
}

$owner = $RepoOwner
if (-not $owner) {
  $user = gh api user -q .login
  $owner = $user
  Write-Host "Using your GitHub username: $owner" -ForegroundColor Gray
} else {
  Write-Host "Using repo owner: $owner" -ForegroundColor Gray
}

$fullRepo = "$owner/$repoName"
$repoUrl = "https://github.com/$fullRepo"

$exists = gh repo view $fullRepo 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Creating GitHub repo: $fullRepo ..." -ForegroundColor Green
  gh repo create $fullRepo --private --description "JARVIS AI Civilian Drone App" --source=. --remote=origin
} else {
  Write-Host ""
  Write-Host "Repo already exists: $repoUrl" -ForegroundColor Green
  $remotes = git remote 2>&1
  if ($remotes -notmatch "origin") {
    git remote add origin "https://github.com/$fullRepo.git"
  } else {
    git remote set-url origin "https://github.com/$fullRepo.git"
  }
}

$branch = git branch --show-current
if ($branch -eq "master") {
  git branch -M main
  Write-Host "Renamed branch to main" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push -u origin main 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "If push failed due to auth, run: gh auth login" -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "=== Repo is live at: $repoUrl ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT: Add secrets and re-run workflows for Fly.io and Cloudflare. See DEPLOY_SETUP.md"
Write-Host "Fly.io app URL (after deploy): https://civilian-drone-app.fly.dev"
Write-Host "Cloudflare Pages URL (after deploy): https://civilian-drone-app.pages.dev"
Write-Host ""
