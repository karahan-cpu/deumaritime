
import { calculateFuelEUCompliance, calculateEUETS, sumEnergyAndEmissions } from "./client/src/lib/calculations";

// Mocking the fuel types since we can't easily import from schema in this standalone script without ts-node setup complexities typically
// But wait, the calculations file imports fuelTypes from @shared/schema. 
// I need those values to be present. 
// I will just mock the "Rows" passed to sumEnergyAndEmissions effectively by trusting the logic there uses the import.
// To run this in the existing environment, I might need to use tsx or similar. 
// Alternatively, I can copy the test logic into a temporary test file that `vitest` or similar could run, 
// OR I can just try to run it with `npx tsx verify_calculations.ts` if tsx is available.
// Given the environment, `npx tsx` is likely the best bet.

async function runTests() {
    console.log("--- Starting Verification ---");

    // TEST CASE 1: FuelEU Maritime
    // Scenario: 1000 MT of HFO in 2025
    // HFO: LCV 40.5 MJ/kg = 0.0405 MJ/g
    // WtT: 13.5 gCO2eq/MJ
    // TtW CO2: 3.114 g/g
    console.log("\n[Test 1] FuelEU Compliance (1000 MT HFO, Year 2025)");

    // We need to simulate the result of sumEnergyAndEmissions because I don't want to re-implement it here.
    // However, I can call it if I can import it.
    // Let's rely on manual values passed to calculateFuelEUCompliance to test the CORE formula.

    // 1000 MT = 1,000,000,000 g
    const massGrams = 1_000_000_000;
    const lcv = 0.0405; // MJ/g
    const wttFactor = 13.5; // g/MJ
    const ttwFactor = 3.114; // g/g (CO2 only for simplicity, neglecting N2O/CH4 for rough verify)
    // Actually HFO has small CH4/N2O, but let's stick to dominant CO2 factor for manual check

    const energy = massGrams * lcv; // 40,500,000 MJ
    const wttEmissions = energy * wttFactor; // 546,750,000 g
    const ttwEmissions = massGrams * ttwFactor; // 3,114,000,000 g
    const totalGHG = wttEmissions + ttwEmissions; // 3,660,750,000 g

    console.log(`Input Energy: ${energy} MJ`);
    console.log(`Input GHG: ${totalGHG} gCO2eq`);

    const res = calculateFuelEUCompliance(energy, totalGHG, 2025);

    console.log("Result:", JSON.stringify(res, null, 2));

    // Expected:
    // Intensity = 3,660,750,000 / 40,500,000 = ~90.388
    // Target 2025 = 91.16 * (1 - 0.02) = 89.3368
    // Compliance = False
    // Balance = (89.3368 - 90.388) * 40,500,000 = -1.0512 * 40.5e6 = ~ -42,573,600
    // Penalty = (42,573,600 / (90.388 * 41000)) * 2400
    //         = (42,573,600 / 3,705,908) * 2400
    //         = 11.488 * 2400 = ~27,571 EUR

    const expectedPenaltyMin = 27000;
    const expectedPenaltyMax = 28000;

    if (res.penalty > expectedPenaltyMin && res.penalty < expectedPenaltyMax) {
        console.log("✅ FuelEU Penalty is within expected range.");
    } else {
        console.error("❌ FuelEU Penalty mismatch!");
    }


    // TEST CASE 2: EU ETS
    // Scenario: Year 2025 (70% Phase-in)
    // 1000 t CO2 Total
    // 600 t Intra-EU
    // 200 t Port
    // Therefore Extra-EU = 200 t (derived)
    // Scope: 100% of 600 + 100% of 200 + 50% of 200 = 600 + 200 + 100 = 900 t Reportable (Pre-Phase-in)
    // Phase-in: 70% of 900 = 630 Allowances.

    console.log("\n[Test 2] EU ETS (2025 Phase-in, Mixed Scope)");
    const etsRes = calculateEUETS(
        1000, // Total CO2
        0, 0, // CH4, N2O
        600, // Intra
        200, // Extra
        200, // Port
        0, 0, 0, 0, 0, 0, // Non-CO2
        100, // Carbon Price
        2025 // Year
    );

    console.log("Result:", JSON.stringify(etsRes, null, 2));

    if (etsRes.allowancesNeeded === 630) {
        console.log("✅ EU ETS Allowances calculation is correct (630).");
    } else {
        console.error(`❌ EU ETS Mismatch. Expected 630, got ${etsRes.allowancesNeeded}`);
    }
}

runTests();
