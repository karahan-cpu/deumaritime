# Maritime Emissions Calculator - Python Optimization Service

## Quick Start

### 1. Install Python Dependencies

```bash
pip install -r server/requirements.txt
```

### 2. Start the Optimization Service

```bash
python server/optimizer_api.py
```

The Python optimization service will run on **http://localhost:5001**

### 3. Start the Main Application (in a separate terminal)

```bash
npm run dev
```

The main application will run on **http://localhost:5000**

## Testing the Optimizer

You can test the Python optimizer directly:

```bash
python server/optimizer.py
```

This will run a test optimization with sample ship data.

## API Endpoints

### POST /api/optimize/cii

Optimize CII rating for a vessel.

**Request:**
```json
{
  "currentParams": {
    "annualFuelConsumption": 18500,
    "distanceTraveled": 95000,
    "fuelType": "HFO"
  },
  "shipInfo": {
    "shipType": "Bulk Carrier",
    "capacity": 85000,
    "year": 2025
  },
  "targetRating": "B"
}
```

**Response:**
```json
{
  "success": true,
  "currentRating": "C",
  "targetRating": "B",
  "achievedRating": "B",
  "currentCII": 5.45,
  "targetCII": 4.89,
  "optimizedCII": 4.85,
  "improvement": 11.2,
  "recommendations": [...]
}
```

## How It Works

1. **Python Optimization Engine**: Uses scipy's differential evolution algorithm for global optimization
2. **Flask API**: Provides REST endpoints for the frontend
3. **React Frontend**: Displays optimization results with actionable recommendations

## Features

- 🎯 **Advanced Optimization**: Uses scipy.optimize for better results than JavaScript
- 📊 **Detailed Recommendations**: Fuel reduction, route optimization, alternative fuels
- 🚀 **Fast**: Typically converges in < 100 iterations
- 🔄 **Real-time**: Instant optimization results
