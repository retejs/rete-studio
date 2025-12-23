# PowerShell script for Windows - Initial setup
# Installs dependencies, builds all packages, and sets up the demo

$ErrorActionPreference = "Stop"

function Setup-Package {
    param(
        [string]$Path,
        [string]$Name
    )

    Write-Host "Setting up $Name..." -ForegroundColor Cyan
    Push-Location $Path

    try {
        if (Test-Path "package-lock.json") {
            Remove-Item "package-lock.json" -Force
        }

        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        npm install --registry=https://registry.npmmirror.com

        Write-Host "  Building..." -ForegroundColor Gray
        npm run build

        Write-Host "  Packing..." -ForegroundColor Gray
        Push-Location dist
        npm pack
        Move-Item *.tgz .. -Force
        Pop-Location

        Start-Sleep -Seconds 2
        Write-Host "✓ $Name setup complete" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

function Setup-App {
    param(
        [string]$Path,
        [string]$Name
    )

    Write-Host "Setting up $Name..." -ForegroundColor Cyan
    Push-Location $Path

    try {
        if (Test-Path "package-lock.json") {
            Remove-Item "package-lock.json" -Force
        }

        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        npm install --registry=https://registry.npmmirror.com

        Write-Host "✓ $Name setup complete" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=== Rete Studio Setup ===" -ForegroundColor Blue
Write-Host ""

Setup-Package "$ScriptDir\core" "rete-studio-core"
Setup-Package "$ScriptDir\languages\template" "rete-studio-template-lang"
Setup-Package "$ScriptDir\languages\javascript" "rete-studio-javascript-lang"
Setup-Package "$ScriptDir\languages\dsl" "rete-studio-dsl-lang"
Setup-Package "$ScriptDir\ui" "rete-studio-ui"
Setup-App "$ScriptDir\demo" "demo"

Write-Host ""
Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host "You can now run 'cd demo; npm run dev' to start the demo" -ForegroundColor Blue
