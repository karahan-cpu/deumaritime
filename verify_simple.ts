
import { calculateFuelEUCompliance, calculateEUETS } from "./client/src/lib/calculations";
import * as fs from 'fs';

async function runTests() {
    let result = "FAIL";
    try {
        // Test 1: FuelEU
        // 1000 MT HFO (40.5 TJ energy, ~3.66 Gg GHG)
        // 2025 limit ~89.34, Actual ~90.39.
        // Penalty approx 27k EUR.
        const massGrams = 1_000_000_000;
        const energy = massGrams * 0.0405;
        const totalGHG = (energy * 13.5) + (massGrams * 3.114);

        const res = calculateFuelEUCompliance(energy, totalGHG, 2025);
        if (res.penalty < 27000 || res.penalty > 28000) {
            throw new Error(`FuelEU Penalty ${res.penalty} out of range`);
        }

        // Test 2: EU ETS
        const etsRes = calculateEUETS(1000, 0, 0, 600, 200, 200, 0, 0, 0, 0, 0, 0, 100, 2025);
        if (etsRes.allowancesNeeded !== 630) {
            throw new Error(`EU ETS Allowances ${etsRes.allowancesNeeded} incorrect`);
        }

        result = "PASS";
    } catch (e) {
        result = `FAIL: ${e.message}`;
    }
    fs.writeFileSync('status.txt', result);
}

runTests();
