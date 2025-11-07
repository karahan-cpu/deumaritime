# PowerShell script to push to GitHub
# Run this script after ensuring Git is installed and accessible

Write-Host "Setting up GitHub repository..." -ForegroundColor Green

# Navigate to project directory
Set-Location $PSScriptRoot

# Check if .git exists
if (Test-Path .git) {
    Write-Host "Git repository already initialized" -ForegroundColor Yellow
} else {
    Write-Host "Initializing git repository..." -ForegroundColor Cyan
    git init
}

# Add all files
Write-Host "Adding files..." -ForegroundColor Cyan
git add .

# Create commit
Write-Host "Creating commit..." -ForegroundColor Cyan
git commit -m "Initial commit: Maritime Calculator"

# Set remote
Write-Host "Setting remote repository..." -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin https://github.com/karahan-cpu/deumaritime.git

# Rename branch to main
Write-Host "Setting branch to main..." -ForegroundColor Cyan
git branch -M main

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "You may need to authenticate. If prompted, enter your GitHub credentials." -ForegroundColor Yellow
git push -u origin main

Write-Host "Done! Your code is now on GitHub at https://github.com/karahan-cpu/deumaritime" -ForegroundColor Green

