# PowerShell script for Windows - Quick package updates
# Rebuilds packages and updates them in the demo without reinstalling dependencies

param(
    [switch]$Core,
    [switch]$Languages,
    [switch]$UI,
    [switch]$All,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host "Usage: .\update-packages.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Update monorepo packages and demo dependencies"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Core        Update core package only"
    Write-Host "  -Languages   Update language packages only (javascript, template, dsl)"
    Write-Host "  -UI          Update UI package only"
    Write-Host "  -All         Update all packages (default)"
    Write-Host "  -Help        Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\update-packages.ps1              # Update all packages"
    Write-Host "  .\update-packages.ps1 -Languages   # Update only language packages"
    Write-Host "  .\update-packages.ps1 -Core -UI    # Update core and UI"
    exit 0
}

function Update-Package {
    param(
        [string]$PackageDir,
        [string]$PackageName
    )

    Write-Host "📦 Updating $PackageName..." -ForegroundColor Yellow
    Push-Location $PackageDir

    try {
        Write-Host "  Building..." -ForegroundColor Gray
        npm run build

        Write-Host "  Packing..." -ForegroundColor Gray
        npm pack

        # Move tarball to package root if it's in dist/
        if (Test-Path "dist\*.tgz") {
            Move-Item "dist\*.tgz" . -Force
        }

        Write-Host "✓ $PackageName updated" -ForegroundColor Green
        Write-Host ""
    }
    finally {
        Pop-Location
    }
}

function Update-DemoPackage {
    param(
        [string]$PackageName,
        [string]$TarballPath
    )

    Write-Host "🔄 Updating $PackageName in demo..." -ForegroundColor Yellow
    Push-Location "$ScriptDir\demo"

    try {
        # Uninstall existing package (suppress errors if not found)
        npm uninstall $PackageName 2>$null

        # Install new package
        npm install $TarballPath

        Write-Host "✓ $PackageName updated in demo" -ForegroundColor Green
        Write-Host ""
    }
    finally {
        Pop-Location
    }
}

# Show help if requested
if ($Help) {
    Show-Help
}

# Default to -All if no options specified
if (-not ($Core -or $Languages -or $UI -or $All)) {
    $All = $true
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=== Rete Studio Package Update Script ===" -ForegroundColor Blue
Write-Host ""

# Update core if requested
if ($All -or $Core) {
    Update-Package "$ScriptDir\core" "rete-studio-core"

    if ($Core -and -not $All) {
        Write-Host "⚠️  Core updated. You may need to update languages and UI packages that depend on it." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Update languages if requested
if ($All -or $Languages) {
    Update-Package "$ScriptDir\languages\template" "rete-studio-template-lang"
    Update-Package "$ScriptDir\languages\javascript" "rete-studio-javascript-lang"
    Update-Package "$ScriptDir\languages\dsl" "rete-studio-dsl-lang"
}

# Update UI if requested
if ($All -or $UI) {
    Update-Package "$ScriptDir\ui" "rete-studio-ui"
}

# Update demo dependencies
Write-Host "=== Updating Demo Dependencies ===" -ForegroundColor Blue
Write-Host ""

if ($All -or $Core) {
    Update-DemoPackage "rete-studio-core" "$ScriptDir\core\rete-studio-core-0.0.0.tgz"
}

if ($All -or $Languages) {
    Update-DemoPackage "rete-studio-template-lang" "$ScriptDir\languages\template\rete-studio-template-lang-0.0.0.tgz"
    Update-DemoPackage "rete-studio-javascript-lang" "$ScriptDir\languages\javascript\rete-studio-javascript-lang-0.0.0.tgz"
    Update-DemoPackage "rete-studio-dsl-lang" "$ScriptDir\languages\dsl\rete-studio-dsl-lang-0.0.0.tgz"
}

if ($All -or $UI) {
    Update-DemoPackage "rete-studio-ui" "$ScriptDir\ui\rete-studio-ui-0.0.0.tgz"
}

Write-Host "✅ All packages updated successfully!" -ForegroundColor Green
Write-Host "You can now run 'cd demo; npm run dev' to start the demo" -ForegroundColor Blue
