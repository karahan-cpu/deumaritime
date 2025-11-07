# GitHub Setup Instructions

## Your Repository
**GitHub URL**: https://github.com/karahan-cpu/deumaritime

## Quick Setup

### Option 1: Use the PowerShell Script (Easiest)

1. Make sure Git is installed: https://git-scm.com/download/win
2. Open PowerShell in the project folder
3. Run the script:
   ```powershell
   .\push-to-github.ps1
   ```

### Option 2: Manual Steps

Open PowerShell or Git Bash in the project directory and run these commands:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Maritime Calculator"

# Set remote repository
git remote add origin https://github.com/karahan-cpu/deumaritime.git

# If remote already exists, remove it first:
# git remote remove origin
# git remote add origin https://github.com/karahan-cpu/deumaritime.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## Authentication

When you run `git push`, you may need to authenticate:

- **Personal Access Token** (Recommended): 
  - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Generate a new token with `repo` permissions
  - Use the token as your password when prompted

- **GitHub CLI**: 
  - Install GitHub CLI: `winget install GitHub.cli`
  - Run `gh auth login`

## After Pushing to GitHub

Once your code is on GitHub, deploy to Vercel:

1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click "Add New Project"
4. Select `karahan-cpu/deumaritime` repository
5. Vercel will auto-detect settings (already configured)
6. Click "Deploy"

Your site will be live at: `https://deumaritime.vercel.app` (or similar)

## Troubleshooting

### Git not found
- Install Git: https://git-scm.com/download/win
- Restart PowerShell after installation

### Authentication failed
- Use Personal Access Token instead of password
- Or use GitHub CLI: `gh auth login`

### Remote already exists
```bash
git remote remove origin
git remote add origin https://github.com/karahan-cpu/deumaritime.git
```

### Files not added
```bash
git add .
git commit -m "Update files"
git push
```

## Next Steps After Deployment

1. ✅ Code pushed to GitHub
2. ✅ Connected to Vercel
3. ✅ Site is live
4. 🎉 Share your Maritime Calculator!

