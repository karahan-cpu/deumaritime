import { fuelTypes } from "@shared/schema";

export function getCO2Factor(fuelType: string): number {
  const fuel = fuelTypes.find(f => f.value === fuelType);
  return fuel?.cf || 3.114;
}

// Lower Heating Values (approx, MJ/kg). Multiplied by 1000 to convert MT→kg
const LHV_MJ_PER_KG: Record<string, number> = {
  HFO: 40.4,
  MDO: 42.7,
  MGO: 42.7,
  LNG: 50.0,
  Methanol: 19.9,
  Ammonia: 18.6,
  LPG: 46.0,
};

export function lhvForFuel(fuelType: string): number {
  return LHV_MJ_PER_KG[fuelType] ?? 40.0;
}

export function sumEnergyAndEmissions(rows: { fuelType: string; tons: number }[]): { totalEnergyMJ: number; ghgKg: number } {
  let totalEnergyMJ = 0;
  let ghgKg = 0;
  for (const r of rows) {
    const tons = Math.max(0, r.tons || 0);
    const lhv = lhvForFuel(r.fuelType);
    const cf = getCO2Factor(r.fuelType);
    const kg = tons * 1000; // metric tons → kg
    totalEnergyMJ += kg * lhv;
    ghgKg += kg * cf; // rough WtT factor proxy using cf (kgCO2/kg fuel)
  }
  return { totalEnergyMJ, ghgKg };
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
  // Validate inputs
  if (!speed || speed <= 0 || !capacity || capacity <= 0) {
    throw new Error("Speed and capacity must be greater than 0");
  }

  // EEDI formula per IMO: EEDI = Σ(CF × SFC × P_ref) / (Capacity × Vref)
  // Where:
  // - CF = Carbon factor (gCO₂/g fuel)
  // - SFC = Specific fuel consumption at reference condition (g/kWh)
  // - P_ref = Engine power at reference condition (kW)
  //   * Main engines: P_ref = 0.75 × MCR
  //   * Auxiliary engines: P_ref = 0.50 × MCR
  // - Capacity = Deadweight tonnage (DWT) in tonnes
  // - Vref = Reference speed in knots (nautical miles per hour)
  // Result: gCO₂/(tonne-nm)
  //
  // Note: User inputs MCR power. SFC should be at reference condition (75% MCR for main, 50% for aux).
  const mainLoadFactor = 0.75; // Main engines: 75% of MCR
  const auxLoadFactor = 0.50; // Auxiliary engines: 50% of MCR (NOT 0.75!)
  
  const cf = getCO2Factor(fuelType);
  
  // Calculate main engine emissions
  // Formula: CF (gCO₂/g) × SFC (g/kWh) × P_ref (kW)
  // Result: gCO₂/h
  let mainEmissionsPerHour = 0;
  if (mainPower > 0 && mainSFC > 0) {
    const referencePower = mainPower * mainLoadFactor;
    mainEmissionsPerHour = cf * mainSFC * referencePower;
  }
  
  // Calculate auxiliary engine emissions
  // Formula: CF (gCO₂/g) × SFC (g/kWh) × P_ref (kW)
  // Result: gCO₂/h
  let auxEmissionsPerHour = 0;
  if (auxPower > 0 && auxSFC > 0) {
    const referencePower = auxPower * auxLoadFactor;
    auxEmissionsPerHour = cf * auxSFC * referencePower;
  }
  
  const totalEmissionsPerHour = mainEmissionsPerHour + auxEmissionsPerHour; // gCO₂/h
  
  if (totalEmissionsPerHour <= 0) {
    throw new Error("Total emissions must be greater than 0. Please check engine inputs.");
  }
  
  // Transport work: Capacity (tonnes) × Vref (knots = nautical miles/hour)
  // Result: tonne-nm/h
  const transportWorkPerHour = capacity * speed; // tonne-nm/h
  
  if (transportWorkPerHour === 0) {
    throw new Error("Transport work (capacity × speed) cannot be zero");
  }
  
  // EEDI formula: EEDI = Σ(CF × SFC × P_ref) / (Capacity × Vref)
  // Units: (gCO₂/h) / (tonne-nm/h) = gCO₂/(tonne-nm)
  // The result is already in the correct units (gCO₂ per tonne-nautical mile)
  const eedi = totalEmissionsPerHour / transportWorkPerHour;
  
  if (!isFinite(eedi) || eedi <= 0) {
    throw new Error("Invalid EEDI calculation result");
  }
  
  return eedi;
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
  // Legacy function - use calculateEEXIFromEngines instead
  // This function is kept for backwards compatibility
  const mainEngines = mainPower > 0 ? [{ power: mainPower, sfc: mainSFC, fuelType }] : [];
  const auxiliaryEngines = auxPower > 0 ? [{ power: auxPower, sfc: auxSFC, fuelType }] : [];
  return calculateEEXIFromEngines(mainEngines, auxiliaryEngines, speed, capacity, hasEPL);
}

export function calculateEEXIFromEngines(
  mainEngines: Array<{ power: number; sfc: number; fuelType: string }>,
  auxiliaryEngines: Array<{ power: number; sfc: number; fuelType: string }>,
  speed: number,
  capacity: number,
  hasEPL: boolean
): number {
  // Validate inputs
  if (!speed || speed <= 0 || !capacity || capacity <= 0) {
    throw new Error("Speed and capacity must be greater than 0");
  }

  // EEXI formula per IMO: EEXI = Σ(CF × SFC × P_ref) / (Capacity × Vref)
  // Where:
  // - CF = Carbon factor (gCO₂/g fuel)
  // - SFC = Specific fuel consumption at reference condition (g/kWh)
  // - P_ref = Engine power at reference condition (kW)
  //   * Main engines: P_ref = 0.75 × MCR (or 0.75 × reduced MCR if EPL applied)
  //   * Auxiliary engines: P_ref = 0.50 × MCR
  // - Capacity = Deadweight tonnage (DWT) in tonnes
  // - Vref = Reference speed in knots (nautical miles per hour)
  // Result: gCO₂/(tonne-nm)
  //
  // Note: User inputs MCR power. SFC should be at reference condition (75% MCR for main, 50% for aux).
  // If EPL is applied, it reduces the available MCR by ~17% (factor 0.83), then load factor is applied.
  const mainLoadFactor = 0.75; // Main engines: 75% of available MCR
  const auxLoadFactor = 0.50; // Auxiliary engines: 50% of MCR
  const eplFactor = 0.83; // EPL reduces available MCR by 17% (typical: 0.80-0.85)
  
  let totalMainEmissions = 0;
  let totalAuxEmissions = 0;

  // Sum emissions from all main engines
  // User inputs MCR power (kW) - this is the maximum continuous rating
  // If EPL is applied: available MCR = MCR × 0.83 (reduced by EPL)
  // Reference power: P_ref = available MCR × 0.75
  // Formula: CF (gCO₂/g) × SFC (g/kWh) × P_ref (kW)
  // Result: gCO₂/h per engine
  for (const engine of mainEngines || []) {
    if (engine && engine.power > 0 && engine.sfc > 0 && engine.fuelType) {
      const cf = getCO2Factor(engine.fuelType);
      // Apply EPL to MCR first (if EPL is enabled), then apply load factor
      const availableMCR = hasEPL ? engine.power * eplFactor : engine.power;
      const referencePower = availableMCR * mainLoadFactor;
      // Calculate emissions in gCO₂/h: CF × SFC × P_ref
      const emissionsPerHour = cf * engine.sfc * referencePower;
      if (isFinite(emissionsPerHour)) {
        totalMainEmissions += emissionsPerHour;
      }
    }
  }

  // Sum emissions from all auxiliary engines
  // Auxiliary engines are NOT affected by EPL (EPL only applies to main propulsion)
  // Reference power: P_ref = MCR × 0.50
  for (const engine of auxiliaryEngines || []) {
    if (engine && engine.power > 0 && engine.sfc > 0 && engine.fuelType) {
      const cf = getCO2Factor(engine.fuelType);
      // Auxiliary engines are not affected by EPL
      const referencePower = engine.power * auxLoadFactor;
      // Calculate emissions in gCO₂/h: CF × SFC × P_ref
      const emissionsPerHour = cf * engine.sfc * referencePower;
      if (isFinite(emissionsPerHour)) {
        totalAuxEmissions += emissionsPerHour;
      }
    }
  }

  const totalEmissionsPerHour = totalMainEmissions + totalAuxEmissions; // gCO₂/h
  
  if (totalEmissionsPerHour <= 0) {
    throw new Error("Total emissions must be greater than 0. Please check engine inputs.");
  }

  // Transport work: Capacity (tonnes) × Vref (knots = nautical miles/hour)
  // Result: tonne-nm/h
  const transportWorkPerHour = capacity * speed; // tonne-nm/h
  
  if (transportWorkPerHour === 0) {
    throw new Error("Transport work (capacity × speed) cannot be zero");
  }

  // EEXI formula: EEXI = Σ(CF × SFC × P) / (Capacity × Vref)
  // Units: (gCO₂/h) / (tonne-nm/h) = gCO₂/(tonne-nm)
  // The result is already in the correct units (gCO₂ per tonne-nautical mile)
  const eexi = totalEmissionsPerHour / transportWorkPerHour;
  
  if (!isFinite(eexi) || eexi <= 0) {
    throw new Error("Invalid EEXI calculation result");
  }

  return eexi;
}

export function calculateRequiredEEXI(
  shipType: string,
  capacity: number,
  year: number
): number {
  if (!capacity || capacity <= 0) {
    throw new Error("Capacity must be greater than 0");
  }

  if (!year || year < 2020) {
    throw new Error("Year must be 2020 or later");
  }

  // Mirror EEDI reference lines for a reasonable default and apply EEXI reductions
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

  if (!isFinite(baseline) || baseline <= 0) {
    throw new Error(`Invalid baseline calculation for ${shipType} with capacity ${capacity}`);
  }

  // EEXI reduction (approximation): 20% from 2023, 30% from 2025+
  let reductionFactor = 0;
  if (year >= 2025) reductionFactor = 0.30;
  else if (year >= 2023) reductionFactor = 0.20;

  const required = baseline * (1 - reductionFactor);

  if (!isFinite(required) || required <= 0) {
    throw new Error("Invalid required EEXI calculation result");
  }

  return required;
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

export interface OptimizationParameters {
  annualFuelConsumption: number;
  distanceTraveled: number;
  mainEnginePower: number;
  auxiliaryPower: number;
  daysAtSea: number;
  daysInPort: number;
  fuelType: string;
  fuelPrice: number;
}

export interface OptimizationConstraints {
  fixedParams: Set<keyof OptimizationParameters>;
  shipType: string;
  shipCapacity: number;
  year: number;
  totalEnergyUsed?: number;
  ghgEmissions?: number;
}

export interface OptimizationTarget {
  type: 'cii_rating' | 'minimize_costs' | 'imo_gfi_surplus' | 'zero_fueleu';
  value?: string;
}

export interface OptimizationResult {
  success: boolean;
  parameters: OptimizationParameters;
  improvements: {
    ciiRating?: string;
    totalCosts?: number;
    imoGFIStatus?: string;
    fuelEUPenalty?: number;
  };
  iterations: number;
}

export function optimizeParameters(
  current: OptimizationParameters,
  target: OptimizationTarget,
  constraints: OptimizationConstraints
): OptimizationResult {
  const maxIterations = 100;
  let best = { ...current };
  let iterations = 0;
  
  const parameterRanges: Record<keyof OptimizationParameters, { min: number; max: number; step: number }> = {
    annualFuelConsumption: { min: 1000, max: 20000, step: 50 },
    distanceTraveled: { min: 20000, max: 150000, step: 500 },
    mainEnginePower: { min: 2000, max: 20000, step: 250 },
    auxiliaryPower: { min: 200, max: 1500, step: 25 },
    daysAtSea: { min: 200, max: 350, step: 2 },
    daysInPort: { min: 0, max: 100, step: 2 },
    fuelType: { min: 0, max: 0, step: 0 },
    fuelPrice: { min: 400, max: 800, step: 5 },
  };
  
  function calculateEnergyAndEmissions(params: OptimizationParameters): { energy: number; emissions: number } {
    const hoursAtSea = params.daysAtSea * 24;
    const hoursInPort = params.daysInPort * 24;
    
    const totalEnergyUsed = 
      (params.mainEnginePower * 0.75 * hoursAtSea + 
       params.auxiliaryPower * 0.5 * hoursAtSea +
       params.auxiliaryPower * 0.3 * hoursInPort) * 3.6;
    
    const fuelConsumption = 
      (params.mainEnginePower * 0.75 * hoursAtSea * (params.fuelType === "HFO" ? 175 : 185) +
       params.auxiliaryPower * 0.5 * hoursAtSea * 220 +
       params.auxiliaryPower * 0.3 * hoursInPort * 220) / 1000000;
    
    const cfFactor = params.fuelType === "HFO" ? 3.114 : 
                     params.fuelType === "LNG" ? 2.750 :
                     params.fuelType === "Methanol" ? 1.375 :
                     params.fuelType === "Ammonia" ? 0 : 3.206;
    
    const ghgEmissions = fuelConsumption * cfFactor * 1000000000;
    
    return { energy: totalEnergyUsed, emissions: ghgEmissions };
  }
  
  function evaluateFitness(params: OptimizationParameters): number {
    if (target.type === 'cii_rating') {
      const cii = calculateCII(
        params.annualFuelConsumption,
        params.distanceTraveled,
        constraints.shipCapacity,
        params.fuelType
      );
      const required = calculateRequiredCII(constraints.shipType, constraints.shipCapacity, constraints.year);
      const rating = getCIIRating(cii, required);
      const targetRating = target.value || 'A';
      const ratingOrder = ['A', 'B', 'C', 'D', 'E'];
      const currentIndex = ratingOrder.indexOf(rating);
      const targetIndex = ratingOrder.indexOf(targetRating);
      return -(currentIndex - targetIndex);
    } else if (target.type === 'minimize_costs') {
      const fuelCost = calculateFuelCost(
        params.mainEnginePower,
        params.auxiliaryPower,
        params.daysAtSea,
        params.daysInPort,
        params.fuelType,
        params.fuelPrice
      );
      return -fuelCost.totalCost;
    } else if (target.type === 'imo_gfi_surplus') {
      const { energy, emissions } = calculateEnergyAndEmissions(params);
      const gfi = calculateIMOGFI(energy, emissions, constraints.year);
      if (gfi.surplus > 0) return gfi.surplus;
      if (gfi.tier1Deficit > 0) return -gfi.tier1Deficit;
      return -gfi.tier2Deficit;
    } else if (target.type === 'zero_fueleu') {
      const { energy, emissions } = calculateEnergyAndEmissions(params);
      const fuelEU = calculateFuelEUCompliance(energy, emissions, constraints.year);
      return -fuelEU.penalty;
    }
    return 0;
  }
  
  let bestFitness = evaluateFitness(best);
  
  for (iterations = 0; iterations < maxIterations; iterations++) {
    let improved = false;
    
    for (const param in best) {
      if (constraints.fixedParams.has(param as keyof OptimizationParameters)) continue;
      if (param === 'fuelType') continue;
      
      const range = parameterRanges[param as keyof OptimizationParameters];
      if (!range || range.step === 0) continue;
      
      const currentValue = best[param as keyof OptimizationParameters] as number;
      
      const testIncrease = { ...best, [param]: Math.min(currentValue + range.step, range.max) };
      const testDecrease = { ...best, [param]: Math.max(currentValue - range.step, range.min) };
      
      const increaseFitness = evaluateFitness(testIncrease);
      const decreaseFitness = evaluateFitness(testDecrease);
      
      if (increaseFitness > bestFitness) {
        best = testIncrease;
        bestFitness = increaseFitness;
        improved = true;
      } else if (decreaseFitness > bestFitness) {
        best = testDecrease;
        bestFitness = decreaseFitness;
        improved = true;
      }
    }
    
    if (!improved) break;
  }
  
  const fuelCost = calculateFuelCost(
    best.mainEnginePower,
    best.auxiliaryPower,
    best.daysAtSea,
    best.daysInPort,
    best.fuelType,
    best.fuelPrice
  );
  
  const cii = calculateCII(
    best.annualFuelConsumption,
    best.distanceTraveled,
    constraints.shipCapacity,
    best.fuelType
  );
  const required = calculateRequiredCII(constraints.shipType, constraints.shipCapacity, constraints.year);
  const rating = getCIIRating(cii, required);
  
  return {
    success: iterations < maxIterations,
    parameters: best,
    improvements: {
      ciiRating: rating,
      totalCosts: fuelCost.totalCost,
    },
    iterations,
  };
}
