import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fuelEUInputSchema, type FuelEUInput } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro } from "lucide-react";
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
  } | null>(null);

  const form = useForm<FuelEUInput>({
    resolver: zodResolver(fuelEUInputSchema),
    defaultValues: {
      totalEnergyUsed: 0,
      ghgEmissions: 0,
      euPortCalls: 0,
      intraEUVoyages: 0,
      year: 2025,
      fuelRows: [],
    },
  });

  const fuelRows = form.watch("fuelRows") as unknown as FuelRow[];

  const derived = useMemo(() => {
    if (!fuelRows || fuelRows.length === 0) return null;
    const { totalEnergyMJ, ghgKg } = sumEnergyAndEmissions(fuelRows);
    return { totalEnergyUsed: totalEnergyMJ, ghgEmissions: ghgKg * 1000 }; // kg→g
  }, [fuelRows]);

  const handleCalculate = (data: FuelEUInput) => {
    const totalEnergy = derived?.totalEnergyUsed || data.totalEnergyUsed;
    const ghg = derived?.ghgEmissions || data.ghgEmissions;
    const res = calculateFuelEUCompliance(totalEnergy, ghg, data.year);
    setResult(res);
    onResultCalculated?.(res);
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
                <CardDescription>GHG intensity limits and penalty estimation (2025-2050)</CardDescription>
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
                <Input
                  id="totalEnergyUsed"
                  type="number"
                  step="0.01"
                  {...form.register("totalEnergyUsed", { valueAsNumber: true })}
                  placeholder="e.g., 750000000"
                  data-testid="input-total-energy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghgEmissions">Total GHG Emissions (gCO₂eq)</Label>
                <Input
                  id="ghgEmissions"
                  type="number"
                  step="0.01"
                  {...form.register("ghgEmissions", { valueAsNumber: true })}
                  placeholder="e.g., 68500000000"
                  data-testid="input-ghg-emissions"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="euPortCalls">EU Port Calls</Label>
                <Input
                  id="euPortCalls"
                  type="number"
                  {...form.register("euPortCalls", { valueAsNumber: true })}
                  placeholder="e.g., 45"
                  data-testid="input-eu-port-calls"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intraEUVoyages">Intra-EU Voyages</Label>
                <Input
                  id="intraEUVoyages"
                  type="number"
                  {...form.register("intraEUVoyages", { valueAsNumber: true })}
                  placeholder="e.g., 12"
                  data-testid="input-intra-eu-voyages"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Compliance Year</Label>
                <Input
                  id="year"
                  type="number"
                  {...form.register("year", { valueAsNumber: true })}
                  placeholder="e.g., 2025"
                  data-testid="input-fueleu-year"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" data-testid="button-calculate-fueleu">
              Calculate FuelEU Compliance
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card data-testid="card-fueleu-results">
          <CardHeader>
            <CardTitle>FuelEU Maritime Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                  <div className="text-sm text-muted-foreground">Penalty Cost</div>
                  <div className="text-2xl font-bold font-mono text-destructive">
                    €{result.penalty.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">If non-compliant</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-2">
                    <ComplianceBadge status={result.compliance ? "compliant" : "non-compliant"} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
