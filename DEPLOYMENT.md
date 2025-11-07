# Deployment Guide

## Quick Start: Deploy to Vercel

### Step 1: Install Git (if not installed)

Download and install Git from: https://git-scm.com/download/win

### Step 2: Initialize Git Repository

Open PowerShell or Git Bash in the project directory and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Maritime Calculator"
```

### Step 3: Create GitHub Repository

1. Go to https://github.com
2. Click the "+" icon → "New repository"
3. Name your repository (e.g., "maritime-calculator")
4. Don't initialize with README (we already have one)
5. Click "Create repository"

### Step 4: Push to GitHub

```bash
# Add remote repository (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 5: Deploy to Vercel

#### Option A: Via Vercel Website (Recommended)

1. Go to https://vercel.com
2. Sign up or log in with your GitHub account
3. Click "Add New Project"
4. Select your repository from the list
5. Vercel will auto-detect:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`
6. Click "Deploy"

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Step 6: Verify Deployment

After deployment, Vercel will provide you with a URL like:
- `https://your-project-name.vercel.app`

Visit the URL to verify your site is live!

## Configuration Files

The following files are already configured:

- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `.gitignore` - Git ignore rules
- ✅ `package.json` - Build scripts
- ✅ `vite.config.ts` - Vite build configuration

## Troubleshooting

### Build Fails on Vercel

1. Check build logs in Vercel dashboard
2. Verify Node.js version (Vercel uses Node 18+ by default)
3. Ensure all dependencies are in `package.json`

### Routes Not Working

The `vercel.json` includes SPA routing configuration. All routes redirect to `index.html`.

### Assets Not Loading

Verify that paths in `vite.config.ts` aliases are correct and assets are in the `attached_assets` folder.

## Environment Variables

If you need environment variables in the future:

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add your variables

## Updating the Site

After making changes:

```bash
# Commit changes
git add .
git commit -m "Your commit message"
git push

# Vercel will automatically redeploy
```

Vercel automatically redeploys when you push to the main branch!

