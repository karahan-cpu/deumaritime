# Git Installation Required

Git is not currently installed or not in your system PATH. You need to install Git to push your code to GitHub.

## Install Git for Windows

### Step 1: Download Git
1. Go to: https://git-scm.com/download/win
2. Download the latest version for Windows
3. Run the installer

### Step 2: Installation Settings
During installation, use these recommended settings:
- **Editor**: Choose your preferred editor (VS Code, Notepad++, etc.)
- **Default branch name**: `main`
- **PATH environment**: Select "Git from the command line and also from 3rd-party software"
- **Line ending conversions**: Select "Checkout Windows-style, commit Unix-style line endings"
- **Terminal emulator**: Use Windows' default console window
- **Default behavior**: Let Git decide
- Click "Install"

### Step 3: Verify Installation
After installation, **restart PowerShell** and run:
```powershell
git --version
```

You should see something like: `git version 2.x.x`

### Step 4: Configure Git (First Time)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 5: Run the Push Script Again
Once Git is installed, run:
```powershell
.\push-to-github.ps1
```

## Alternative: Use GitHub Desktop

If you prefer a GUI:
1. Download GitHub Desktop: https://desktop.github.com/
2. Sign in with your GitHub account
3. Add the repository: File → Add Local Repository
4. Select your project folder
5. Commit and push using the GUI

## After Git is Installed

Once Git is installed, you can:
1. Run `.\push-to-github.ps1` again
2. Or manually run the git commands from `GITHUB_SETUP.md`

## Quick Commands (After Git Installation)

```bash
git init
git add .
git commit -m "Initial commit: Maritime Calculator"
git remote add origin https://github.com/karahan-cpu/deumaritime.git
git branch -M main
git push -u origin main
```

