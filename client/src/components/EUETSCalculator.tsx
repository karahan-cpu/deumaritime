import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { euETSInputSchema, type EUETSInput } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro } from "lucide-react";
import { useState, useEffect } from "react";
import { calculateEUETS } from "@/lib/calculations";

interface EUETSCalculatorProps {
  onResultCalculated?: (result: { allowancesNeeded: number; cost: number; coverage: number }) => void;
}

export function EUETSCalculator({ onResultCalculated }: EUETSCalculatorProps = {}) {
  const [result, setResult] = useState<{
    allowancesNeeded: number;
    cost: number;
    coverage: number;
    totalReportable: number;
  } | null>(null);

  const form = useForm<EUETSInput>({
    resolver: zodResolver(euETSInputSchema),
    defaultValues: {
      totalCO2Emissions: undefined,
      intra_EU_CO2: undefined,
      port_CO2: undefined,
      carbonPrice: undefined,
      year: 2025,
      // CH4/N2O
      totalCH4Emissions: 0,
      intra_EU_CH4: 0,
      port_CH4: 0,
      totalN2OEmissions: 0,
      intra_EU_N2O: 0,
      port_N2O: 0,
    },
  });

  const year = form.watch("year");
  const showNonCO2 = year >= 2026;

  const handleCalculate = (data: EUETSInput) => {
    // Derive Extra-EU from Total - Intra - Port
    const extra_CO2 = Math.max(0, data.totalCO2Emissions - (data.intra_EU_CO2 || 0) - (data.port_CO2 || 0));

    let extra_CH4 = 0;
    let extra_N2O = 0;

    if (showNonCO2) {
      extra_CH4 = Math.max(0, (data.totalCH4Emissions || 0) - (data.intra_EU_CH4 || 0) - (data.port_CH4 || 0));
      extra_N2O = Math.max(0, (data.totalN2OEmissions || 0) - (data.intra_EU_N2O || 0) - (data.port_N2O || 0));
    }

    const res = calculateEUETS(
      data.totalCO2Emissions,
      data.totalCH4Emissions || 0,
      data.totalN2OEmissions || 0,
      data.intra_EU_CO2 || 0,
      extra_CO2,
      data.port_CO2 || 0,
      data.intra_EU_CH4 || 0,
      extra_CH4,
      data.port_CH4 || 0,
      data.intra_EU_N2O || 0,
      extra_N2O,
      data.port_N2O || 0,
      data.carbonPrice,
      data.year
    );

    setResult(res);
    if (onResultCalculated) {
      onResultCalculated({ allowancesNeeded: res.allowancesNeeded, cost: res.cost, coverage: res.coverage });
    }
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
                <CardDescription>Estimated cost of allowances under Directive (EU) 2023/959</CardDescription>
              </div>
            </div>
            <Badge variant={year >= 2026 ? "default" : "secondary"} className="text-xs uppercase">
              {year >= 2026 ? "100% Coverage" : year === 2025 ? "70% Coverage" : "40% Coverage"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleCalculate)} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Compliance Year</Label>
                  <Input
                    id="year"
                    type="number"
                    {...form.register("year", { valueAsNumber: true })}
                    placeholder="e.g., 2025"
                    data-testid="input-euets-year"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbonPrice">Carbon Price (€/EUA)</Label>
                  <Input
                    id="carbonPrice"
                    type="number"
                    step="0.01"
                    {...form.register("carbonPrice", { valueAsNumber: true })}
                    placeholder="e.g., 85"
                    data-testid="input-carbon-price"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                <h4 className="font-semibold text-sm">CO₂ Emissions (Tonnes)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalCO2Emissions">Total CO₂</Label>
                    <Input
                      id="totalCO2Emissions"
                      type="number"
                      step="0.01"
                      {...form.register("totalCO2Emissions", { valueAsNumber: true })}
                      placeholder="Total TtW CO2"
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intra_EU_CO2">Intra-EU</Label>
                    <Input
                      id="intra_EU_CO2"
                      type="number"
                      step="0.01"
                      {...form.register("intra_EU_CO2", { valueAsNumber: true })}
                      placeholder="Between EU ports"
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port_CO2">At Berth/Port</Label>
                    <Input
                      id="port_CO2"
                      type="number"
                      step="0.01"
                      {...form.register("port_CO2", { valueAsNumber: true })}
                      placeholder="In EU ports"
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </div>
              </div>

              {showNonCO2 && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                    <h4 className="font-semibold text-sm">CH₄ Emissions (Tonnes)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalCH4Emissions">Total CH₄</Label>
                        <Input
                          id="totalCH4Emissions"
                          type="number"
                          step="0.001"
                          {...form.register("totalCH4Emissions", { valueAsNumber: true })}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="intra_EU_CH4">Intra-EU</Label>
                        <Input
                          id="intra_EU_CH4"
                          type="number"
                          step="0.001"
                          {...form.register("intra_EU_CH4", { valueAsNumber: true })}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="port_CH4">At Berth</Label>
                        <Input
                          id="port_CH4"
                          type="number"
                          step="0.001"
                          {...form.register("port_CH4", { valueAsNumber: true })}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                    <h4 className="font-semibold text-sm">N₂O Emissions (Tonnes)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalN2OEmissions">Total N₂O</Label>
                        <Input
                          id="totalN2OEmissions"
                          type="number"
                          step="0.001"
                          {...form.register("totalN2OEmissions", { valueAsNumber: true })}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="intra_EU_N2O">Intra-EU</Label>
                        <Input
                          id="intra_EU_N2O"
                          type="number"
                          step="0.001"
                          {...form.register("intra_EU_N2O", { valueAsNumber: true })}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="port_N2O">At Berth</Label>
                        <Input
                          id="port_N2O"
                          type="number"
                          step="0.001"
                          {...form.register("port_N2O", { valueAsNumber: true })}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  <div className="text-sm text-muted-foreground">Reportable Emissions</div>
                  <div className="text-3xl font-bold font-mono">
                    {result.totalReportable.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">tonnes CO₂eq</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Allowances Needed</div>
                  <div className="text-3xl font-bold font-mono text-primary">
                    {result.allowancesNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">EUA ({(result.coverage * 100).toFixed(0)}%)</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                  <div className="text-3xl font-bold font-mono text-destructive">
                    €{result.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">@ €{form.getValues().carbonPrice} / EUA</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
