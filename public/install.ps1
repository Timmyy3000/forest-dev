# Forest installer for Windows — https://forest.timi.click
# Usage: irm https://forest.timi.click/install.ps1 | iex
$ErrorActionPreference = 'Stop'

$Repo = 'Timmyy3000/git-forest'
$Arch = if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq [System.Runtime.InteropServices.Architecture]::Arm64) { 'arm64' } else { 'amd64' }
$Asset = "forest_windows_$Arch.exe"
$InstallDir = Join-Path $env:LOCALAPPDATA 'forest\bin'

function Write-Info($msg) { Write-Host $msg -ForegroundColor Green }

# --- try a prebuilt release binary first ---
$DownloadUrl = $null
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -UseBasicParsing
    $match = $release.assets | Where-Object { $_.name -eq $Asset } | Select-Object -First 1
    if ($match) { $DownloadUrl = $match.browser_download_url }
} catch { }

if ($DownloadUrl) {
    Write-Info "downloading $Asset ..."
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    $Target = Join-Path $InstallDir 'forest.exe'
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $Target -UseBasicParsing
    Write-Info "installed forest to $Target"

    $UserPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ($UserPath -notlike "*$InstallDir*") {
        [Environment]::SetEnvironmentVariable('Path', "$UserPath;$InstallDir", 'User')
        Write-Info "added $InstallDir to your user PATH — restart your terminal to pick it up"
    }
    exit 0
}

# --- fall back to go install when Go is available ---
if (Get-Command go -ErrorAction SilentlyContinue) {
    Write-Info "no prebuilt binary for windows/$Arch yet — building from source with go install ..."
    go install "github.com/$Repo/cmd/forest@latest"
    Write-Info 'installed forest via go install (in $(go env GOPATH)\bin)'
    exit 0
}

Write-Host "error: no prebuilt binary available for windows/$Arch and Go is not installed." -ForegroundColor Red
Write-Host 'install Go (https://go.dev/dl) and re-run, or build from source:' -ForegroundColor Red
Write-Host "  git clone https://github.com/$Repo; cd git-forest; go build ./cmd/forest" -ForegroundColor Red
exit 1
