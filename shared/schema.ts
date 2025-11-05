import { z } from "zod";

export const shipTypes = [
  "Bulk Carrier",
  "Oil Tanker",
  "Chemical Tanker",
  "LNG Carrier",
  "LPG Carrier",
  "Container Ship",
  "General Cargo",
  "Refrigerated Cargo",
  "RoRo Cargo",
  "RoRo Passenger",
] as const;

export const fuelTypes = [
  { value: "HFO", label: "Heavy Fuel Oil (HFO)", cf: 3.114 },
  { value: "MDO", label: "Marine Diesel Oil (MDO)", cf: 3.206 },
  { value: "MGO", label: "Marine Gas Oil (MGO)", cf: 3.206 },
  { value: "LNG", label: "Liquefied Natural Gas (LNG)", cf: 2.750 },
  { value: "Methanol", label: "Methanol", cf: 1.375 },
  { value: "Ammonia", label: "Ammonia", cf: 0 },
  { value: "LPG", label: "Liquefied Petroleum Gas (LPG)", cf: 3.000 },
] as const;

export const shipInfoSchema = z.object({
  shipName: z.string().min(1, "Ship name is required"),
  shipType: z.enum(shipTypes),
  deadweight: z.number().positive("Deadweight must be positive"),
  grossTonnage: z.number().positive("Gross tonnage must be positive"),
  yearBuilt: z.number().min(1900).max(2030),
  isNewBuild: z.boolean(),
});

export const eediInputSchema = z.object({
  mainEnginePower: z.number().positive("Main engine power must be positive"),
  mainEngineSFC: z.number().positive("SFC must be positive"),
  auxiliaryPower: z.number().positive("Auxiliary power must be positive"),
  auxiliarySFC: z.number().positive("Auxiliary SFC must be positive"),
  referenceSpeed: z.number().positive("Reference speed must be positive"),
  capacity: z.number().positive("Capacity must be positive"),
  fuelType: z.string(),
});

export const eexiInputSchema = z.object({
  mainEnginePower: z.number().positive(),
  mainEngineSFC: z.number().positive(),
  auxiliaryPower: z.number().positive(),
  auxiliarySFC: z.number().positive(),
  speed: z.number().positive(),
  capacity: z.number().positive(),
  fuelType: z.string(),
  hasEPL: z.boolean(),
});

export const ciiInputSchema = z.object({
  annualFuelConsumption: z.number().positive(),
  distanceTraveled: z.number().positive(),
  capacity: z.number().positive(),
  fuelType: z.string(),
  year: z.number().min(2023).max(2030),
});

export const fuelEUInputSchema = z.object({
  totalEnergyUsed: z.number().positive(),
  ghgEmissions: z.number().positive(),
  euPortCalls: z.number().int().positive(),
  intraEUVoyages: z.number().int().nonnegative(),
  year: z.number().min(2025).max(2050),
});

export const euETSInputSchema = z.object({
  totalCO2Emissions: z.number().positive(),
  intraEUEmissions: z.number().nonnegative(),
  euPortEmissions: z.number().nonnegative(),
  carbonPrice: z.number().positive(),
  year: z.number().min(2024).max(2026),
});

export const imoGFIInputSchema = z.object({
  totalEnergyUsed: z.number().positive("Total energy must be positive"),
  ghgEmissions: z.number().positive("GHG emissions must be positive"),
  year: z.number().min(2028).max(2050),
});

export const shipbuildingCostInputSchema = z.object({
  deadweight: z.number().positive("Deadweight must be positive"),
  grossTonnage: z.number().positive("Gross tonnage must be positive"),
  shipType: z.enum(shipTypes),
  isNewBuild: z.boolean(),
});

export const fuelCostInputSchema = z.object({
  mainEnginePower: z.number().positive("Main engine power must be positive"),
  auxiliaryPower: z.number().positive("Auxiliary power must be positive"),
  daysAtSea: z.number().positive("Days at sea must be positive"),
  daysInPort: z.number().nonnegative("Days in port must be non-negative"),
  fuelType: z.string(),
  fuelPrice: z.number().positive("Fuel price must be positive"),
});

export type ShipInfo = z.infer<typeof shipInfoSchema>;
export type EEDIInput = z.infer<typeof eediInputSchema>;
export type EEXIInput = z.infer<typeof eexiInputSchema>;
export type CIIInput = z.infer<typeof ciiInputSchema>;
export type FuelEUInput = z.infer<typeof fuelEUInputSchema>;
export type EUETSInput = z.infer<typeof euETSInputSchema>;
export type IMOGFIInput = z.infer<typeof imoGFIInputSchema>;
export type ShipbuildingCostInput = z.infer<typeof shipbuildingCostInputSchema>;
export type FuelCostInput = z.infer<typeof fuelCostInputSchema>;
