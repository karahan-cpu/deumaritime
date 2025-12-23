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
  // LCV (MJ/g), WtT (gCO2eq/MJ), TtW factors (g/g_fuel)
  { value: "HFO", label: "Heavy Fuel Oil (HFO)", lcv: 0.0405, wtt: 13.5, ttw_co2: 3.114, ttw_ch4: 0.00005, ttw_n2o: 0.00018 },
  { value: "MDO", label: "Marine Diesel Oil (MDO)", lcv: 0.0427, wtt: 14.1, ttw_co2: 3.206, ttw_ch4: 0.00005, ttw_n2o: 0.00018 },
  { value: "MGO", label: "Marine Gas Oil (MGO)", lcv: 0.0427, wtt: 14.1, ttw_co2: 3.206, ttw_ch4: 0.00005, ttw_n2o: 0.00018 },
  { value: "LNG", label: "Liquefied Natural Gas (LNG) - Otto", lcv: 0.0500, wtt: 18.5, ttw_co2: 2.750, ttw_ch4: 0.0, ttw_n2o: 0.00011, slip_percent: 3.1 }, // Otto cycle (high slip)
  { value: "LNG_Diesel", label: "Liquefied Natural Gas (LNG) - Diesel", lcv: 0.0500, wtt: 18.5, ttw_co2: 2.750, ttw_ch4: 0.0, ttw_n2o: 0.00011, slip_percent: 0.2 }, // Diesel cycle (low slip)
  { value: "Methanol", label: "Methanol (fossil)", lcv: 0.0199, wtt: 30.0, ttw_co2: 1.375, ttw_ch4: 0.0, ttw_n2o: 0.0 }, // Fossil methanol high WtT
  { value: "Ammonia", label: "Ammonia (fossil)", lcv: 0.0186, wtt: 120.0, ttw_co2: 0, ttw_ch4: 0.0, ttw_n2o: 0.0, ttw_n2o_slip: 0.03 }, // High WtT for grey ammonia
  { value: "LPG", label: "Liquefied Petroleum Gas (LPG)", lcv: 0.0460, wtt: 7.8, ttw_co2: 3.000, ttw_ch4: 0.00005, ttw_n2o: 0.00018 },
  { value: "B100", label: "Biodiesel (B100)", lcv: 0.0370, wtt: 5.0, ttw_co2: 2.8, ttw_ch4: 0.0, ttw_n2o: 0.0 }, // Simplified bio-factor (CO2 neutral in TtW often?)
  { value: "H2", label: "Hydrogen (Green)", lcv: 0.1200, wtt: 0.0, ttw_co2: 0, ttw_ch4: 0, ttw_n2o: 0 },
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
  mainEnginePower: z.number().nonnegative("Main engine power must be non-negative").optional(),
  mainEngineSFC: z.number().positive("SFC must be positive").optional(),
  auxiliaryPower: z.number().nonnegative("Auxiliary power must be non-negative").optional(),
  auxiliarySFC: z.number().positive("Auxiliary SFC must be positive").optional(),
  referenceSpeed: z.number().nonnegative("Reference speed must be a positive number").default(0),
  capacity: z.number().nonnegative("Capacity must be a positive number").default(0),
  fuelType: z.string().optional(),
  // Engine rows (new approach)
  mainEngines: z.array(engineRowSchema).default([]),
  auxiliaryEngines: z.array(engineRowSchema).default([]),
  // Optional additions
  engineInfo: engineInfoSchema.optional(),
  fuelRows: z.array(fuelRowSchema).optional(),
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
  intra_EU_CO2: z.number().nonnegative().default(0),
  extra_EU_CO2: z.number().nonnegative().default(0),
  port_CO2: z.number().nonnegative().default(0),

  // CH4 and N2O (Required from 2026)
  totalCH4Emissions: z.number().nonnegative().default(0).optional(),
  intra_EU_CH4: z.number().nonnegative().default(0).optional(),
  extra_EU_CH4: z.number().nonnegative().default(0).optional(),
  port_CH4: z.number().nonnegative().default(0).optional(),

  totalN2OEmissions: z.number().nonnegative().default(0).optional(),
  intra_EU_N2O: z.number().nonnegative().default(0).optional(),
  extra_EU_N2O: z.number().nonnegative().default(0).optional(),
  port_N2O: z.number().nonnegative().default(0).optional(),

  carbonPrice: z.number().positive(),
  year: z.number().min(2024).max(2030),
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
