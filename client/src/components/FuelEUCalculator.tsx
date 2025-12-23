import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fuelEUInputSchema, type FuelEUInput } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { LockableInput } from "@/components/ui/lockable-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { calculateFuelEUCompliance, sumEnergyAndEmissions } from "@/lib/calculations";
import { ComplianceBadge } from "./ComplianceBadge";
import { FuelRowsList, type FuelRow } from "./FuelRowsList";

interface FuelEUCalculatorProps {
  onResultCalculated?: (result: { intensity: number; limit: number; penalty: number; compliance: boolean }) => void;
}

export function FuelEUCalculator({ onResultCalculated }: FuelEUCalculatorProps = {}) {
  const [result, setResult] = useState<{
    intensity: number;
    limit: number;
    penalty: number;
    compliance: boolean;
    complianceBalance: number;
    deficit: number;
  } | null>(null);
  const [recommendation, setRecommendation] = useState<{ message: string, impact: string } | null>(null);

  const form = useForm<FuelEUInput>({
    resolver: zodResolver(fuelEUInputSchema),
    defaultValues: {
      totalEnergyUsed: undefined,
      ghgEmissions: undefined,
      euPortCalls: undefined,
      intraEUVoyages: undefined,
      year: undefined,
      fuelRows: [],
    },
  });

  const fuelRows = form.watch("fuelRows") as unknown as FuelRow[];

  // Watch for inputs
  const totalEnergyUsed = form.watch("totalEnergyUsed");
  const ghgEmissions = form.watch("ghgEmissions");
  const euPortCalls = form.watch("euPortCalls");
  const intraEUVoyages = form.watch("intraEUVoyages");
  const year = form.watch("year");

  const derived = useMemo(() => {
    if (!fuelRows || fuelRows.length === 0) return null;
    const { totalEnergyMJ, ghgKg } = sumEnergyAndEmissions(fuelRows);
    return { totalEnergyUsed: totalEnergyMJ, ghgEmissions: ghgKg * 1000 }; // kg→g
  }, [fuelRows]);

  const handleCalculate = (data: FuelEUInput) => {
    const totalEnergy = derived?.totalEnergyUsed || data.totalEnergyUsed;
    const ghg = derived?.ghgEmissions || data.ghgEmissions;
    setRecommendation(null);

    // Validate inputs
    if (!totalEnergy || totalEnergy <= 0) {
      form.setError("totalEnergyUsed", { message: "Total energy must be greater than 0" });
      return;
    }

    if (ghg < 0) {
      form.setError("ghgEmissions", { message: "GHG emissions cannot be negative" });
      return;
    }

    try {
      const res = calculateFuelEUCompliance(totalEnergy, ghg, data.year);
      setResult(res);
      onResultCalculated?.(res);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown calculation error';
      console.error("FuelEU calculation error:", err);
      form.setError("root", { message: errorMessage });
    }
  };

  const handleOptimize = () => {
    if (!result || result.compliance) return;

    // Simple heuristic recommendation
    const currentIntensity = result.intensity;
    const target = result.limit;
    const reductionNeeded = ((currentIntensity - target) / currentIntensity) * 100;

    setRecommendation({
      message: `Your GHG intensity is ${currentIntensity.toFixed(2)} gCO₂eq/MJ, which exceeds the limit of ${target.toFixed(2)}. You need to reduce intensity by ${reductionNeeded.toFixed(1)}%. Consider switching to lower-carbon fuels like Bio-LNG or Methanol, or using On-shore Power Supply (OPS) during port calls.`,
      impact: "high"
    });
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-fueleu-calculator">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>FuelEU Maritime Calculator</CardTitle>
                <CardDescription>GHG intensity limits, compliance balance, and penalty (2025-2050)</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs uppercase">Well-to-Wake</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleCalculate)} className="space-y-6">
            <div className="space-y-4">
              <FuelRowsList
                title="2. Fuel Consumption"
                value={(fuelRows as FuelRow[]) || []}
                onChange={(rows) => form.setValue("fuelRows", rows as any, { shouldDirty: true })}
              />
              {derived && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded border">
                    <div className="text-muted-foreground">Derived Total Energy</div>
                    <div className="font-mono font-semibold">{derived.totalEnergyUsed.toLocaleString(undefined, { maximumFractionDigits: 0 })} MJ</div>
                  </div>
                  <div className="p-3 rounded border">
                    <div className="text-muted-foreground">Derived GHG Emissions</div>
                    <div className="font-mono font-semibold">{derived.ghgEmissions.toLocaleString(undefined, { maximumFractionDigits: 0 })} gCO₂eq</div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalEnergyUsed">Total Energy Used (MJ)</Label>
                <LockableInput
                  id="totalEnergyUsed"
                  type="number"
                  step="0.01"
                  {...form.register("totalEnergyUsed", { valueAsNumber: true })}
                  value={totalEnergyUsed || ""}
                  placeholder="e.g., 750000000"
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghgEmissions">Total GHG Emissions (gCO₂eq)</Label>
                <LockableInput
                  id="ghgEmissions"
                  type="number"
                  step="0.01"
                  {...form.register("ghgEmissions", { valueAsNumber: true })}
                  value={ghgEmissions || ""}
                  placeholder="e.g., 68500000000"
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="euPortCalls">EU Port Calls</Label>
                <LockableInput
                  id="euPortCalls"
                  type="number"
                  {...form.register("euPortCalls", { valueAsNumber: true })}
                  value={euPortCalls || ""}
                  placeholder="e.g., 45"
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intraEUVoyages">Intra-EU Voyages</Label>
                <LockableInput
                  id="intraEUVoyages"
                  type="number"
                  {...form.register("intraEUVoyages", { valueAsNumber: true })}
                  value={intraEUVoyages || ""}
                  placeholder="e.g., 12"
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Compliance Year</Label>
                <LockableInput
                  id="year"
                  type="number"
                  {...form.register("year", { valueAsNumber: true })}
                  value={year || 2025}
                  placeholder="e.g., 2025"
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </div>

            {form.formState.errors.root && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                data-testid="button-calculate-fueleu"
                disabled={
                  (!derived && (!form.watch("totalEnergyUsed") || form.watch("totalEnergyUsed") <= 0)) ||
                  (!derived && (!form.watch("ghgEmissions") || form.watch("ghgEmissions") < 0))
                }
              >
                Calculate FuelEU Compliance
              </Button>
              {result && !result.compliance && (
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={handleOptimize}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Fuel Recommendations
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card data-testid="card-fueleu-results">
          <CardHeader>
            <CardTitle>FuelEU Maritime Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">GHG Intensity</div>
                  <div className="text-2xl font-bold font-mono">{result.intensity.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">gCO₂eq/MJ</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Required Limit</div>
                  <div className="text-2xl font-bold font-mono">{result.limit.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">gCO₂eq/MJ</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">{result.compliance ? "Surplus Balance" : "Deficit (Penalty)"}</div>
                  <div className={`text-2xl font-bold font-mono ${result.compliance ? "text-green-600" : "text-destructive"}`}>
                    {result.compliance ? "+" : "-"}{Math.abs(result.complianceBalance / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground">tonnes CO₂eq</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Financial Impact</div>
                  <div className={`text-2xl font-bold font-mono ${result.penalty > 0 ? "text-destructive" : "text-slate-900"}`}>
                    €{result.penalty.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.penalty > 0 ? "Penalty due" : "No penalty"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div className="text-sm font-medium">Compliance Status:</div>
                <ComplianceBadge status={result.compliance ? "compliant" : "non-compliant"} />
              </div>

              {recommendation && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Optimization Recommendation
                  </h4>
                  <p className="text-green-800 mt-2">
                    {recommendation.message}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
