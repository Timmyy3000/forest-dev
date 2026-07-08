# Forest installer for Windows — https://forest.timi.click
# Usage: irm https://forest.timi.click/install.ps1 | iex
$ErrorActionPreference = 'Stop'

$Repo = 'Timmyy3000/git-forest'
$Arch = if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq [System.Runtime.InteropServices.Architecture]::Arm64) { 'arm64' } else { 'amd64' }
$Asset = "forest_windows_$Arch.zip"
$InstallDir = Join-Path $env:LOCALAPPDATA 'forest\bin'

function Write-Info($msg) { Write-Host $msg -ForegroundColor Green }

# --- try a prebuilt release archive first ---
$DownloadUrl = $null
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -UseBasicParsing
    $match = $release.assets | Where-Object { $_.name -eq $Asset } | Select-Object -First 1
    if ($match) { $DownloadUrl = $match.browser_download_url }
} catch { }

if ($DownloadUrl) {
    Write-Info "downloading $Asset ..."
    $Tmp = Join-Path $env:TEMP ("forest-install-" + [System.Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force -Path $Tmp | Out-Null
    try {
        $ZipPath = Join-Path $Tmp $Asset
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath -UseBasicParsing
        Expand-Archive -Path $ZipPath -DestinationPath $Tmp -Force
        New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
        $Target = Join-Path $InstallDir 'forest.exe'
        Move-Item -Path (Join-Path $Tmp 'forest.exe') -Destination $Target -Force
        Write-Info "installed forest to $Target"

        $UserPath = [Environment]::GetEnvironmentVariable('Path', 'User')
        if ($UserPath -notlike "*$InstallDir*") {
            [Environment]::SetEnvironmentVariable('Path', "$UserPath;$InstallDir", 'User')
            Write-Info "added $InstallDir to your user PATH — restart your terminal to pick it up"
        }

        # Warn about any other forest.exe on PATH that would shadow this
        # install (e.g. a copy left in ~/.local/bin by an old install.sh run).
        $others = @(Get-Command forest -All -ErrorAction SilentlyContinue |
            Where-Object { $_.Source -and ($_.Source -ne $Target) })
        foreach ($other in $others) {
            Write-Host "warning: another forest at $($other.Source) may shadow the one just installed" -ForegroundColor Yellow
            Write-Host "         remove it so 'forest' picks up new versions:  Remove-Item '$($other.Source)'" -ForegroundColor Yellow
        }
    } finally {
        Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue
    }
    exit 0
}

# --- fall back to go install when Go is available ---
if (Get-Command go -ErrorAction SilentlyContinue) {
    Write-Info "no prebuilt archive for windows/$Arch — building from source with go install ..."
    go install "github.com/$Repo/cmd/forest@latest"
    Write-Info 'installed forest via go install (in $(go env GOPATH)\bin)'
    exit 0
}

Write-Host "error: no prebuilt archive available for windows/$Arch and Go is not installed." -ForegroundColor Red
Write-Host 'install Go (https://go.dev/dl) and re-run, or build from source:' -ForegroundColor Red
Write-Host "  git clone https://github.com/$Repo; cd git-forest; go build ./cmd/forest" -ForegroundColor Red
exit 1
