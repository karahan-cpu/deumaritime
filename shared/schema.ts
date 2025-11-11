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

// New shared schemas
export const fuelRowSchema = z.object({
  fuelType: z.string(),
  tons: z.number().positive().default(0),
});

export const engineInfoSchema = z.object({
  engineType: z.enum(["two_stroke", "four_stroke"]).default("two_stroke"),
  count: z.number().int().positive().default(1),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  sfc: z.number().positive().optional(),
});

export const engineRowSchema = z.object({
  power: z.number().nonnegative("Power must be non-negative").default(0),
  sfc: z.number().positive("SFC must be positive").default(190),
  fuelType: z.string().default("HFO"),
  engineType: z.enum(["two_stroke", "four_stroke"]).optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
});

export const eediInputSchema = z.object({
  mainEnginePower: z.number().nonnegative("Main engine power must be non-negative").default(0),
  mainEngineSFC: z.number().positive("SFC must be positive").default(190),
  auxiliaryPower: z.number().nonnegative("Auxiliary power must be non-negative").default(0),
  auxiliarySFC: z.number().positive("Auxiliary SFC must be positive").default(215),
  referenceSpeed: z.number().positive("Reference speed must be greater than 0"),
  capacity: z.number().positive("Capacity must be greater than 0"),
  fuelType: z.string().default("HFO"),
  // Optional additions
  engineInfo: engineInfoSchema.optional(),
  fuelRows: z.array(fuelRowSchema).optional(),
}).refine((data) => {
  // At least one engine (main or auxiliary) must have power > 0
  return data.mainEnginePower > 0 || data.auxiliaryPower > 0;
}, {
  message: "At least one engine with power > 0 is required",
  path: ["mainEnginePower"]
});

export const eexiInputSchema = z.object({
  mainEnginePower: z.number().positive().optional(),
  mainEngineSFC: z.number().positive().optional(),
  auxiliaryPower: z.number().positive().optional(),
  auxiliarySFC: z.number().positive().optional(),
  speed: z.number().nonnegative("Speed must be a positive number").default(0),
  capacity: z.number().nonnegative("Capacity must be a positive number").default(0),
  fuelType: z.string().optional(),
  hasEPL: z.boolean().default(false),
  // Engine rows (new approach)
  mainEngines: z.array(engineRowSchema).default([]),
  auxiliaryEngines: z.array(engineRowSchema).default([]),
  // Legacy fields (optional, for backwards compatibility)
  engineInfo: engineInfoSchema.optional(),
  fuelRows: z.array(fuelRowSchema).optional(),
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
  // Optional dynamic rows for deriving totals instead of direct input
  fuelRows: z.array(fuelRowSchema).optional(),
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

export const fleetVesselSchema = z.object({
  id: z.string(),
  vesselName: z.string().min(1, "Vessel name is required"),
  
  // Ship Info
  type: z.enum(shipTypes).optional(),
  dwt: z.number().positive("DWT must be positive").optional(),
  grossTonnage: z.number().positive("Gross tonnage must be positive").optional(),
  buildYear: z.number().min(1900).max(2030).optional(),
  isNewBuild: z.boolean().optional(),
  
  // Operational Parameters
  annualFuelConsumption: z.number().positive().optional(),
  distanceTraveled: z.number().positive().optional(),
  mainEnginePower: z.number().positive().optional(),
  mainEngineSFC: z.number().positive().optional(),
  auxiliaryPower: z.number().positive().optional(),
  auxiliarySFC: z.number().positive().optional(),
  daysAtSea: z.number().positive().optional(),
  daysInPort: z.number().nonnegative().optional(),
  fuelType: z.string().optional(),
  fuelPrice: z.number().positive().optional(),
  referenceSpeed: z.number().positive().optional(),
  capacity: z.number().positive().optional(),
  hasEPL: z.boolean().optional(),
  year: z.number().min(2023).max(2050).optional(),
  
  // Calculated Results (computed automatically)
  eexi: z.number().optional(),
  ciiRating: z.enum(["A", "B", "C", "D", "E"]).optional(),
  ciiValue: z.number().optional(),
  fuelEUStatus: z.string().optional(),
  euETSCost: z.number().optional(),
  imoGFICost: z.number().optional(),
  fuelCost: z.number().optional(),
  totalCost: z.number().optional(),
});

export type ShipInfo = z.infer<typeof shipInfoSchema>;
export type FuelRow = z.infer<typeof fuelRowSchema>;
export type EngineInfo = z.infer<typeof engineInfoSchema>;
export type EngineRow = z.infer<typeof engineRowSchema>;
export type EEDIInput = z.infer<typeof eediInputSchema>;
export type EEXIInput = z.infer<typeof eexiInputSchema>;
export type CIIInput = z.infer<typeof ciiInputSchema>;
export type FuelEUInput = z.infer<typeof fuelEUInputSchema>;
export type EUETSInput = z.infer<typeof euETSInputSchema>;
export type IMOGFIInput = z.infer<typeof imoGFIInputSchema>;
export type ShipbuildingCostInput = z.infer<typeof shipbuildingCostInputSchema>;
export type FuelCostInput = z.infer<typeof fuelCostInputSchema>;
export type FleetVessel = z.infer<typeof fleetVesselSchema>;

// User types for storage (if needed for future authentication)
export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = Omit<User, "id">;
