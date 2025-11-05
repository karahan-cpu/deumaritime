import { fuelTypes } from "@shared/schema";

export function getCO2Factor(fuelType: string): number {
  const fuel = fuelTypes.find(f => f.value === fuelType);
  return fuel?.cf || 3.114;
}

export function calculateEEDI(
  mainPower: number,
  mainSFC: number,
  auxPower: number,
  auxSFC: number,
  speed: number,
  capacity: number,
  fuelType: string
): number {
  const cf = getCO2Factor(fuelType);
  const mainEmissions = (cf * mainSFC * mainPower * 0.75) / 1000000;
  const auxEmissions = (cf * auxSFC * auxPower * 0.75) / 1000000;
  const totalEmissions = mainEmissions + auxEmissions;
  const transportWork = capacity * speed;
  return (totalEmissions / transportWork) * 1000000000;
}

export function calculateRequiredEEDI(shipType: string, capacity: number, year: number): number {
  const referencelines: Record<string, { a: number; c: number }> = {
    "Bulk Carrier": { a: 961.79, c: 0.477 },
    "Oil Tanker": { a: 1218.80, c: 0.488 },
    "Chemical Tanker": { a: 1218.80, c: 0.488 },
    "LNG Carrier": { a: 2253.7, c: 0.474 },
    "Container Ship": { a: 174.22, c: 0.201 },
    "General Cargo": { a: 107.48, c: 0.216 },
    "RoRo Cargo": { a: 752.16, c: 0.381 },
    "Refrigerated Cargo": { a: 227.01, c: 0.244 },
  };

  const ref = referencelines[shipType] || referencelines["Bulk Carrier"];
  const baseline = ref.a * Math.pow(capacity, -ref.c);
  
  let reductionFactor = 0;
  if (year >= 2025) reductionFactor = 0.30;
  else if (year >= 2020) reductionFactor = 0.20;
  else if (year >= 2015) reductionFactor = 0.10;
  
  return baseline * (1 - reductionFactor);
}

export function calculateEEXI(
  mainPower: number,
  mainSFC: number,
  auxPower: number,
  auxSFC: number,
  speed: number,
  capacity: number,
  fuelType: string,
  hasEPL: boolean
): number {
  const powerFactor = hasEPL ? 0.83 : 0.75;
  return calculateEEDI(mainPower, mainSFC, auxPower, auxSFC, speed, capacity, fuelType);
}

export function calculateCII(
  fuelConsumption: number,
  distance: number,
  capacity: number,
  fuelType: string
): number {
  const cf = getCO2Factor(fuelType);
  const co2Emissions = fuelConsumption * cf;
  const transportWork = capacity * distance;
  return (co2Emissions / transportWork) * 1000000;
}

export function getCIIRating(attainedCII: number, requiredCII: number): string {
  const ratio = attainedCII / requiredCII;
  
  if (ratio <= 0.88) return "A";
  if (ratio <= 0.94) return "B";
  if (ratio <= 1.06) return "C";
  if (ratio <= 1.18) return "D";
  return "E";
}

export function calculateRequiredCII(shipType: string, capacity: number, year: number): number {
  const baselines: Record<string, { a: number; c: number }> = {
    "Bulk Carrier": { a: 4745, c: 0.622 },
    "Oil Tanker": { a: 5247, c: 0.610 },
    "Container Ship": { a: 1984, c: 0.489 },
    "LNG Carrier": { a: 9.827, c: 0 },
    "General Cargo": { a: 31948, c: 0.792 },
  };

  const baseline = baselines[shipType] || baselines["Bulk Carrier"];
  const baseCII = baseline.a * Math.pow(capacity, -baseline.c);
  
  const reductionFactors: Record<number, number> = {
    2023: 0.05,
    2024: 0.07,
    2025: 0.09,
    2026: 0.11,
    2027: 0.13,
    2028: 0.15,
    2029: 0.17,
    2030: 0.19,
  };
  
  const reduction = reductionFactors[year] || 0.11;
  return baseCII * (1 - reduction);
}

export function calculateFuelEUCompliance(
  totalEnergy: number,
  ghgEmissions: number,
  year: number
): { intensity: number; limit: number; penalty: number; compliance: boolean } {
  const intensity = (ghgEmissions / totalEnergy) * 1000;
  
  const baseline = 91.16;
  const reductionTargets: Record<number, number> = {
    2025: 0.02, 2026: 0.02,
    2027: 0.04, 2028: 0.05, 2029: 0.056,
    2030: 0.06, 2031: 0.08, 2032: 0.10, 2033: 0.12, 2034: 0.135,
    2035: 0.145, 2036: 0.18, 2037: 0.21, 2038: 0.25, 2039: 0.285,
    2040: 0.31, 2041: 0.37, 2042: 0.43, 2043: 0.50, 2044: 0.565,
    2045: 0.62, 2046: 0.68, 2047: 0.73, 2048: 0.77, 2049: 0.785,
    2050: 0.80,
  };
  
  const reduction = reductionTargets[year] || 0.02;
  const limit = baseline * (1 - reduction);
  
  const compliance = intensity <= limit;
  const deficit = Math.max(0, intensity - limit);
  const penaltyRate = 2400;
  const penalty = (deficit * totalEnergy * penaltyRate) / 1000;
  
  return { intensity, limit, penalty, compliance };
}

export function calculateEUETS(
  totalEmissions: number,
  intraEUEmissions: number,
  portEmissions: number,
  carbonPrice: number,
  year: number
): { allowancesNeeded: number; cost: number; coverage: number } {
  const coverageRates: Record<number, number> = {
    2024: 0.40,
    2025: 0.70,
    2026: 1.00,
  };
  
  const coverage = coverageRates[year] || 0.70;
  
  const internationalEmissions = totalEmissions - intraEUEmissions - portEmissions;
  const reportableEmissions = 
    intraEUEmissions + 
    portEmissions + 
    (internationalEmissions * 0.5);
  
  const allowancesNeeded = reportableEmissions * coverage;
  const cost = allowancesNeeded * carbonPrice;
  
  return { allowancesNeeded, cost, coverage };
}

export function calculateIMOGFI(
  totalEnergyUsed: number,
  ghgEmissions: number,
  year: number
): {
  attainedGFI: number;
  baseTarget: number;
  directTarget: number;
  tier1Deficit: number;
  tier2Deficit: number;
  surplus: number;
  tier1Cost: number;
  tier2Cost: number;
  rewardCost: number;
  compliance: 'surplus' | 'tier1' | 'tier2';
} {
  const baseline2008 = 93.3;
  
  const attainedGFI = (ghgEmissions / totalEnergyUsed) * 1000;
  
  const reductionTargets: Record<number, { base: number; direct: number }> = {
    2028: { base: 0.04, direct: 0.17 },
    2029: { base: 0.06, direct: 0.21 },
    2030: { base: 0.08, direct: 0.21 },
    2031: { base: 0.10, direct: 0.25 },
    2032: { base: 0.12, direct: 0.29 },
    2033: { base: 0.15, direct: 0.33 },
    2034: { base: 0.20, direct: 0.38 },
    2035: { base: 0.30, direct: 0.43 },
    2036: { base: 0.35, direct: 0.48 },
    2037: { base: 0.40, direct: 0.53 },
    2038: { base: 0.45, direct: 0.58 },
    2039: { base: 0.55, direct: 0.69 },
    2040: { base: 0.65, direct: 0.80 },
  };
  
  const targets = year >= 2040 
    ? reductionTargets[2040] 
    : (reductionTargets[year] || reductionTargets[2028]);
  const baseTarget = baseline2008 * (1 - targets.base);
  const directTarget = baseline2008 * (1 - targets.direct);
  
  const tier1Price = 100;
  const tier2Price = 380;
  
  let tier1Deficit = 0;
  let tier2Deficit = 0;
  let surplus = 0;
  let compliance: 'surplus' | 'tier1' | 'tier2' = 'surplus';
  
  if (attainedGFI <= directTarget) {
    surplus = ((directTarget - attainedGFI) * totalEnergyUsed) / 1000000;
    compliance = 'surplus';
  } else if (attainedGFI <= baseTarget) {
    tier1Deficit = ((attainedGFI - directTarget) * totalEnergyUsed) / 1000000;
    compliance = 'tier1';
  } else {
    tier2Deficit = ((attainedGFI - baseTarget) * totalEnergyUsed) / 1000000;
    tier1Deficit = ((baseTarget - directTarget) * totalEnergyUsed) / 1000000;
    compliance = 'tier2';
  }
  
  const tier1Cost = tier1Deficit * tier1Price;
  const tier2Cost = tier2Deficit * tier2Price;
  const rewardCost = 0;
  
  return {
    attainedGFI,
    baseTarget,
    directTarget,
    tier1Deficit,
    tier2Deficit,
    surplus,
    tier1Cost,
    tier2Cost,
    rewardCost,
    compliance,
  };
}

export function calculateShipbuildingCost(
  deadweight: number,
  grossTonnage: number,
  shipType: string,
  isNewBuild: boolean
): number {
  if (!isNewBuild) {
    return 0;
  }
  
  const baseCostPerDWT: Record<string, number> = {
    "Bulk Carrier": 700,
    "Oil Tanker": 750,
    "Chemical Tanker": 850,
    "LNG Carrier": 1200,
    "LPG Carrier": 900,
    "Container Ship": 950,
    "General Cargo": 650,
    "Refrigerated Cargo": 800,
    "RoRo Cargo": 850,
    "RoRo Passenger": 1100,
  };
  
  const costPerDWT = baseCostPerDWT[shipType] || 800;
  const baseCost = deadweight * costPerDWT;
  
  const complexityFactor = grossTonnage / deadweight;
  const adjustment = complexityFactor > 1.5 ? 1.1 : 1.0;
  
  return baseCost * adjustment;
}

export function calculateFuelCost(
  mainEnginePower: number,
  auxiliaryPower: number,
  daysAtSea: number,
  daysInPort: number,
  fuelType: string,
  fuelPrice: number
): {
  mainEngineConsumption: number;
  auxiliaryConsumption: number;
  totalConsumption: number;
  totalCost: number;
} {
  const mainEngineSFOC = fuelType === "HFO" ? 175 : 185;
  const auxiliarySFOC = 220;
  
  const mainEnginePowerAtSea = mainEnginePower * 0.75;
  const auxiliaryPowerAtSea = auxiliaryPower * 0.5;
  const auxiliaryPowerInPort = auxiliaryPower * 0.3;
  
  const mainEngineConsumption = 
    (mainEnginePowerAtSea * mainEngineSFOC * 24 * daysAtSea) / 1000000;
  
  const auxiliaryConsumptionAtSea = 
    (auxiliaryPowerAtSea * auxiliarySFOC * 24 * daysAtSea) / 1000000;
  
  const auxiliaryConsumptionInPort = 
    (auxiliaryPowerInPort * auxiliarySFOC * 24 * daysInPort) / 1000000;
  
  const auxiliaryConsumption = auxiliaryConsumptionAtSea + auxiliaryConsumptionInPort;
  const totalConsumption = mainEngineConsumption + auxiliaryConsumption;
  const totalCost = totalConsumption * fuelPrice;
  
  return {
    mainEngineConsumption,
    auxiliaryConsumption,
    totalConsumption,
    totalCost,
  };
}
