import { fuelTypes } from "@shared/schema";

// Global Warming Potentials (100-year, IPCC AR5)
const GWP_CO2 = 1;
const GWP_CH4 = 28;
const GWP_N2O = 265;

export function getFuelProps(fuelType: string) {
  const fuel = fuelTypes.find(f => f.value === fuelType);
  if (!fuel) {
    // Fallback to HFO defaults if not found
    return {
      lcv: 0.0405, // MJ/g
      wtt: 13.5,   // gCO2eq/MJ
      ttw_co2: 3.114,
      ttw_ch4: 0.00005,
      ttw_n2o: 0.00018,
      slip_percent: 0
    };
  }
  return fuel;
}

export function getCO2Factor(fuelType: string): number {
  const props = getFuelProps(fuelType);
  return props.ttw_co2;
}

export function lhvForFuel(fuelType: string): number {
  const props = getFuelProps(fuelType);
  return props.lcv * 1000; // Convert MJ/g -> MJ/kg
}

export function sumEnergyAndEmissions(rows: { fuelType: string; tons: number }[]): {
  totalEnergyMJ: number;
  ghgKg: number;
  totalCO2: number; // For EU ETS
  totalCH4: number;
  totalN2O: number;
  wttGhgs: number;
  ttwGhgs: number;
} {
  let totalEnergyMJ = 0;
  let totalCO2 = 0;
  let totalCH4 = 0;
  let totalN2O = 0;
  let wttGhgs = 0;
  let ttwGhgs = 0;

  for (const r of rows) {
    const tons = Math.max(0, r.tons || 0);
    const massGrams = tons * 1000000; // MT -> grams
    const props = getFuelProps(r.fuelType);

    // Energy (MJ)
    const energyMJ = massGrams * props.lcv;
    totalEnergyMJ += energyMJ;

    // WtT Emissions (gCO2eq) = Energy * WtT_factor
    wttGhgs += energyMJ * props.wtt;

    // TtW Emissions
    // CO2
    const co2 = massGrams * props.ttw_co2;
    totalCO2 += co2;

    // CH4
    let ch4 = massGrams * props.ttw_ch4;
    // Add slip if applicable (LNG)
    if ('slip_percent' in props && props.slip_percent) {
      ch4 += massGrams * (props.slip_percent / 100);
    }
    totalCH4 += ch4;

    // N2O
    let n2o = massGrams * props.ttw_n2o;
    if ('ttw_n2o_slip' in props && props.ttw_n2o_slip) {
      n2o += massGrams * (props.ttw_n2o_slip / 100);
    }
    totalN2O += n2o;

    // TtW CO2eq
    ttwGhgs += (co2 * GWP_CO2) + (ch4 * GWP_CH4) + (n2o * GWP_N2O);
  }

  const totalGhgGrams = wttGhgs + ttwGhgs;

  return {
    totalEnergyMJ,
    ghgKg: totalGhgGrams / 1000,
    totalCO2: totalCO2 / 1000, // kg
    totalCH4: totalCH4 / 1000,
    totalN2O: totalN2O / 1000,
    wttGhgs: wttGhgs / 1000,
    ttwGhgs: ttwGhgs / 1000
  };
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
  const mainEngines = mainPower > 0 ? [{ power: mainPower, sfc: mainSFC, fuelType }] : [];
  const auxiliaryEngines = auxPower > 0 ? [{ power: auxPower, sfc: auxSFC, fuelType }] : [];
  return calculateEEDIFromEngines(mainEngines, auxiliaryEngines, speed, capacity);
}

export function calculateEEDIFromEngines(
  mainEngines: Array<{ power: number; sfc: number; fuelType: string }>,
  auxiliaryEngines: Array<{ power: number; sfc: number; fuelType: string }>,
  speed: number,
  capacity: number
): number {
  if (!speed || speed <= 0 || !capacity || capacity <= 0) {
    throw new Error("Speed and capacity must be greater than 0");
  }

  const mainLoadFactor = 0.75;
  const auxLoadFactor = 0.50;

  let totalMainEmissions = 0;
  let totalAuxEmissions = 0;

  for (const engine of mainEngines || []) {
    if (engine && engine.power > 0 && engine.sfc > 0 && engine.fuelType) {
      const cf = getCO2Factor(engine.fuelType);
      const referencePower = engine.power * mainLoadFactor;
      const emissionsPerHour = cf * engine.sfc * referencePower;
      if (isFinite(emissionsPerHour)) {
        totalMainEmissions += emissionsPerHour;
      }
    }
  }

  for (const engine of auxiliaryEngines || []) {
    if (engine && engine.power > 0 && engine.sfc > 0 && engine.fuelType) {
      const cf = getCO2Factor(engine.fuelType);
      const referencePower = engine.power * auxLoadFactor;
      const emissionsPerHour = cf * engine.sfc * referencePower;
      if (isFinite(emissionsPerHour)) {
        totalAuxEmissions += emissionsPerHour;
      }
    }
  }

  const totalEmissionsPerHour = totalMainEmissions + totalAuxEmissions;

  if (totalEmissionsPerHour <= 0) {
    throw new Error("Total emissions must be greater than 0. Please check engine inputs.");
  }

  const transportWorkPerHour = capacity * speed;

  if (transportWorkPerHour === 0) {
    throw new Error("Transport work (capacity × speed) cannot be zero");
  }

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
  if (!speed || speed <= 0 || !capacity || capacity <= 0) {
    throw new Error("Speed and capacity must be greater than 0");
  }

  const mainLoadFactor = 0.75;
  const auxLoadFactor = 0.50;
  const eplFactor = 0.83;

  let totalMainEmissions = 0;
  let totalAuxEmissions = 0;

  for (const engine of mainEngines || []) {
    if (engine && engine.power > 0 && engine.sfc > 0 && engine.fuelType) {
      const cf = getCO2Factor(engine.fuelType);
      const availableMCR = hasEPL ? engine.power * eplFactor : engine.power;
      const referencePower = availableMCR * mainLoadFactor;
      const emissionsPerHour = cf * engine.sfc * referencePower;
      if (isFinite(emissionsPerHour)) {
        totalMainEmissions += emissionsPerHour;
      }
    }
  }

  for (const engine of auxiliaryEngines || []) {
    if (engine && engine.power > 0 && engine.sfc > 0 && engine.fuelType) {
      const cf = getCO2Factor(engine.fuelType);
      const referencePower = engine.power * auxLoadFactor;
      const emissionsPerHour = cf * engine.sfc * referencePower;
      if (isFinite(emissionsPerHour)) {
        totalAuxEmissions += emissionsPerHour;
      }
    }
  }

  const totalEmissionsPerHour = totalMainEmissions + totalAuxEmissions;

  if (totalEmissionsPerHour <= 0) {
    throw new Error("Total emissions must be greater than 0. Please check engine inputs.");
  }

  const transportWorkPerHour = capacity * speed;

  if (transportWorkPerHour === 0) {
    throw new Error("Transport work (capacity × speed) cannot be zero");
  }

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
    2019: 0.00, 2020: 0.01, 2021: 0.02, 2022: 0.03, 2023: 0.05,
    2024: 0.07, 2025: 0.09, 2026: 0.11, 2027: 0.13, 2028: 0.15,
    2029: 0.17, 2030: 0.19, 2031: 0.21, 2032: 0.23, 2033: 0.25,
    2034: 0.27, 2035: 0.29, 2036: 0.31, 2037: 0.33, 2038: 0.35,
    2039: 0.37, 2040: 0.39,
  };

  let reduction = reductionFactors[year];
  if (!reduction) {
    if (year > 2040) {
      reduction = 0.39; // Simplified cap
    } else {
      // Linear interpolation if needed, or assume closest
      reduction = 0.05; // Fallback
    }
  }

  return baseCII * (1 - reduction);
}

export function calculateFuelEUCompliance(
  totalEnergy: number,
  ghgEmissions: number,
  year: number
): { intensity: number; limit: number; penalty: number; compliance: boolean; deficit: number; complianceBalance: number } {
  if (!totalEnergy || totalEnergy <= 0) {
    throw new Error("Total energy must be greater than 0");
  }
  if (ghgEmissions < 0) {
    throw new Error("GHG emissions cannot be negative");
  }

  const intensity = ghgEmissions / totalEnergy;
  const baseline = 91.16;

  let reduction = 0;
  if (year >= 2050) reduction = 0.80;
  else if (year >= 2045) reduction = 0.62;
  else if (year >= 2040) reduction = 0.31;
  else if (year >= 2035) reduction = 0.145;
  else if (year >= 2030) reduction = 0.06;
  else if (year >= 2025) reduction = 0.02;
  else reduction = 0;

  const limit = baseline * (1 - reduction);

  // Compliance Balance (CB)
  const complianceBalance = (limit - intensity) * totalEnergy;

  const compliance = complianceBalance >= 0;

  // Penalty Calculation
  // Formula: Penalty (EUR) = (abs(CB) / (Actual_Intensity * 41000)) * 2400
  let penalty = 0;
  if (!compliance) {
    if (intensity > 0) {
      penalty = (Math.abs(complianceBalance) / (intensity * 41000)) * 2400;
    } else {
      penalty = 0;
    }
  }

  return { intensity, limit, penalty, compliance, deficit: complianceBalance < 0 ? Math.abs(complianceBalance) : 0, complianceBalance };
}

export function calculateEUETS(
  totalCO2: number, // TtW CO2
  totalCH4: number, // TtW CH4
  totalN2O: number,
  intraEU_CO2: number,
  extraEU_CO2: number,
  port_CO2: number,
  intraEU_CH4: number,
  extraEU_CH4: number,
  port_CH4: number,
  intraEU_N2O: number,
  extraEU_N2O: number,
  port_N2O: number,
  carbonPrice: number,
  year: number
): { allowancesNeeded: number; cost: number; coverage: number; totalReportable: number } {

  const coverageRates: Record<number, number> = {
    2024: 0.40,
    2025: 0.70,
    2026: 1.00,
  };
  const coverage = coverageRates[year] || (year > 2026 ? 1.00 : 0);

  // CO2 Scope: 100% Intra, 100% Port, 50% Extra
  const reportableCO2 = intraEU_CO2 + port_CO2 + (extraEU_CO2 * 0.5);

  let reportableCH4 = 0;
  let reportableN2O = 0;

  if (year >= 2026) {
    reportableCH4 = intraEU_CH4 + port_CH4 + (extraEU_CH4 * 0.5);
    reportableN2O = intraEU_N2O + port_N2O + (extraEU_N2O * 0.5);
  }

  const totalReportableCO2eq = reportableCO2 + (reportableCH4 * GWP_CH4) + (reportableN2O * GWP_N2O);

  const allowancesNeeded = totalReportableCO2eq * coverage;
  const cost = allowancesNeeded * carbonPrice;

  return { allowancesNeeded, cost, coverage, totalReportable: totalReportableCO2eq };
}

export function calculateSimpleEUETS(
  totalEmissions: number,
  carbonPrice: number,
  year: number
): { allowancesNeeded: number; cost: number; coverage: number } {
  // Wrapper approximation: Assume all emissions are reportable CO2
  const res = calculateEUETS(totalEmissions, 0, 0, totalEmissions, 0, 0, 0, 0, 0, 0, 0, 0, carbonPrice, year);
  return { allowancesNeeded: res.allowancesNeeded, cost: res.cost, coverage: res.coverage };
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

  const targets = (year >= 2040)
    ? { base: 0.65, direct: 0.80 }
    : (reductionTargets[year] || { base: 0.04, direct: 0.17 });

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

// Optimization types
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
  // Simplified return to prevent crashes
  return {
    success: false,
    parameters: current,
    improvements: {},
    iterations: 0
  };
}
