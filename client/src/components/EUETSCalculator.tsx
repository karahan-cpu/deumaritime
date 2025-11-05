import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { euETSInputSchema, type EUETSInput } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro } from "lucide-react";
import { useState } from "react";
import { calculateEUETS } from "@/lib/calculations";

interface EUETSCalculatorProps {
  onResultCalculated?: (result: { allowancesNeeded: number; cost: number; coverage: number }) => void;
}

export function EUETSCalculator({ onResultCalculated }: EUETSCalculatorProps = {}) {
  const [result, setResult] = useState<{
    allowancesNeeded: number;
    cost: number;
    coverage: number;
  } | null>(null);

  const form = useForm<EUETSInput>({
    resolver: zodResolver(euETSInputSchema),
    defaultValues: {
      totalCO2Emissions: 0,
      intraEUEmissions: 0,
      euPortEmissions: 0,
      carbonPrice: 85,
      year: 2025,
    },
  });

  const handleCalculate = (data: EUETSInput) => {
    const res = calculateEUETS(
      data.totalCO2Emissions,
      data.intraEUEmissions,
      data.euPortEmissions,
      data.carbonPrice,
      data.year
    );
    setResult(res);
    if (onResultCalculated) {
      onResultCalculated(res);
    }
    console.log("EU ETS calculated:", res);
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-euets-calculator">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>EU ETS Calculator</CardTitle>
                <CardDescription>Emissions Trading System allowance costs (2024-2026)</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs uppercase">70% Coverage (2025)</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleCalculate)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalCO2Emissions">Total CO₂ Emissions (tonnes)</Label>
                <Input
                  id="totalCO2Emissions"
                  type="number"
                  step="0.01"
                  {...form.register("totalCO2Emissions", { valueAsNumber: true })}
                  placeholder="e.g., 58000"
                  data-testid="input-total-co2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intraEUEmissions">Intra-EU Emissions (tonnes)</Label>
                <Input
                  id="intraEUEmissions"
                  type="number"
                  step="0.01"
                  {...form.register("intraEUEmissions", { valueAsNumber: true })}
                  placeholder="e.g., 8500"
                  data-testid="input-intra-eu-co2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="euPortEmissions">EU Port Emissions (tonnes)</Label>
                <Input
                  id="euPortEmissions"
                  type="number"
                  step="0.01"
                  {...form.register("euPortEmissions", { valueAsNumber: true })}
                  placeholder="e.g., 2400"
                  data-testid="input-eu-port-co2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carbonPrice">Carbon Price (€/tonne)</Label>
                <Input
                  id="carbonPrice"
                  type="number"
                  step="0.01"
                  {...form.register("carbonPrice", { valueAsNumber: true })}
                  placeholder="Current: ~€85"
                  data-testid="input-carbon-price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Compliance Year</Label>
                <Input
                  id="year"
                  type="number"
                  {...form.register("year", { valueAsNumber: true })}
                  placeholder="2024, 2025, or 2026"
                  data-testid="input-euets-year"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" data-testid="button-calculate-euets">
              Calculate EU ETS Cost
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card data-testid="card-euets-results">
          <CardHeader>
            <CardTitle>EU ETS Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Allowances Needed</div>
                  <div className="text-3xl font-bold font-mono">
                    {result.allowancesNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">tonnes CO₂</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                  <div className="text-3xl font-bold font-mono text-destructive">
                    €{result.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">Annual allowance cost</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Coverage Rate</div>
                  <div className="text-3xl font-bold font-mono">{(result.coverage * 100).toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">of total emissions</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
