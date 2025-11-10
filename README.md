# 2025 Maritime Calculator

A comprehensive maritime emissions and compliance calculator for ship owners. Calculate EEDI, EEXI, CII ratings, FuelEU Maritime penalties, EU ETS costs, and GFI compliance with detailed cost analysis and regulatory guidance.

**Live Demo**: [View on Vercel](https://deumaritime.vercel.app)  
**Repository**: [GitHub](https://github.com/karahan-cpu/deumaritime)

## Features

- **EEDI / EEXI Calculator**: Energy efficiency design index for new builds and existing ships
- **Main Engine Selection**: Engine type (2‑stroke/4‑stroke), count, manufacturer/model, SFC override
- **Dynamic Fuel Rows**: Add/remove fuel types with per‑fuel consumption; used to derive FuelEU totals
- **CII Rating**: Annual carbon intensity indicator with A-E rating system
- **FuelEU Maritime**: GHG intensity limits and penalty calculations for EU operations
- **EU ETS**: Emissions trading system allowance costs for EU ports
- **IMO GFI**: Global Fuel Intensity calculator
- **Cost Analysis**: Comprehensive cost breakdown including shipbuilding, fuel, and regulatory costs

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS, shadcn/ui
- **Charts**: Recharts
- **Backend**: Express.js, Node.js
- **Validation**: Zod

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type check
npm run check
```

The app will be available at `http://localhost:5000`

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the settings:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist/public`
     - Install Command: `npm install`
   - Click "Deploy"

The `vercel.json` file is already configured for optimal deployment.

### Alternative: Deploy using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

## Project Structure

```
├── client/          # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utility functions and calculations
├── server/          # Express backend server
├── shared/          # Shared types and schemas
└── attached_assets/ # Static assets

```

## License

MIT

## Author

2025 Maritime Calculator by Karahan Karakurt

