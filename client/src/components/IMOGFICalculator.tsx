import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { imoGFIInputSchema, type IMOGFIInput } from "@shared/schema";
import { calculateIMOGFI } from "@/lib/calculations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LockableInput } from "@/components/ui/lockable-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export function IMOGFICalculator({ onCalculate }: {
  onCalculate?: (result: ReturnType<typeof calculateIMOGFI>) => void
}) {
  const [result, setResult] = useState<ReturnType<typeof calculateIMOGFI> | null>(null);
  const [lockedFields, setLockedFields] = useState<Record<string, boolean>>({});
  const [recommendation, setRecommendation] = useState<{ message: string } | null>(null);

  const form = useForm<IMOGFIInput>({
    resolver: zodResolver(imoGFIInputSchema),
    defaultValues: {
      totalEnergyUsed: 0,
      ghgEmissions: 0,
      year: 2028,
    },
  });

  const onSubmit = (data: IMOGFIInput) => {
    const calculationResult = calculateIMOGFI(
      data.totalEnergyUsed,
      data.ghgEmissions,
      data.year
    );
    setResult(calculationResult);
    setRecommendation(null);
    onCalculate?.(calculationResult);
  };

  const handleOptimize = () => {
    if (!result || result.compliance === 'surplus') return;

    // Target: Base Target (Tier 1 threshold) or Direct Target (Tier 2 threshold)?
    // Usually we want to at least reach the Base Target to avoid Tier 2 penalty.
    // Better yet, reach Direct Target to avoid ANY penalty.

    // Attained = GHG / Energy * 1000
    // Target = DirectTarget (gCO2/MJ)
    // Required GHG = Target * Energy / 1000

    const isGHGLocked = lockedFields["ghgEmissions"];
    const isEnergyLocked = lockedFields["totalEnergyUsed"];

    if (isGHGLocked) {
      setRecommendation({ message: "GHG Emissions input is locked. Cannot optimize emissions. Unlock to calculate required reduction." });
      return;
    }

    const currentEnergy = form.getValues().totalEnergyUsed;
    const targetIntensity = result.directTarget; // Aim for full compliance

    // New Max Emissions
    const maxEmissions = (targetIntensity * currentEnergy) / 1000;

    form.setValue("ghgEmissions", Number(maxEmissions.toFixed(0))); // integer gCO2 approximation
    setRecommendation({
      message: `Limited GHG Emissions to ${maxEmissions.toLocaleString(undefined, { maximumFractionDigits: 0 })} gCO₂eq to meet the Direct Target.`
    });

    // Trigger update
    onSubmit({ ...form.getValues(), ghgEmissions: maxEmissions });
  };

  return (
    <Card data-testid="card-imo-gfi-calculator">
      <CardHeader>
        <CardTitle>IMO GHG Fuel Intensity (GFI) Calculator</CardTitle>
        <CardDescription>
          Calculate two-tier GHG pricing penalties (2028-2040). Tier 1: $100/tCO₂eq, Tier 2: $380/tCO₂eq
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="totalEnergyUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Energy Used (MJ)</FormLabel>
                  <FormControl>
                    <LockableInput
                      type="number"
                      placeholder="e.g., 404000000"
                      data-testid="input-total-energy"
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      isLocked={lockedFields["totalEnergyUsed"]}
                      onLockChange={(locked) => setLockedFields(prev => ({ ...prev, totalEnergyUsed: locked }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ghgEmissions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total GHG Emissions (gCO₂eq)</FormLabel>
                  <FormControl>
                    <LockableInput
                      type="number"
                      placeholder="e.g., 36764000000"
                      data-testid="input-ghg-emissions"
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      isLocked={lockedFields["ghgEmissions"]}
                      onLockChange={(locked) => setLockedFields(prev => ({ ...prev, ghgEmissions: locked }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compliance Year</FormLabel>
                  <FormControl>
                    <LockableInput
                      type="number"
                      placeholder="2028"
                      data-testid="input-year"
                      {...field}
                      value={field.value || 2028}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" data-testid="button-calculate-gfi">
              Calculate IMO GFI Compliance
            </Button>

            {result && result.compliance !== 'surplus' && (
              <Button
                type="button"
                variant="secondary"
                className="w-full mt-2"
                onClick={handleOptimize}
                data-testid="button-optimize-gfi"
              >
                <Zap className="mr-2 h-4 w-4" />
                Optimize Unlocked Inputs
              </Button>
            )}
          </form>
        </Form>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Results</h3>
              <Badge
                variant={
                  result.compliance === 'surplus'
                    ? 'default'
                    : result.compliance === 'tier1'
                      ? 'secondary'
                      : 'destructive'
                }
                data-testid="badge-compliance-status"
              >
                {result.compliance === 'surplus'
                  ? 'Surplus'
                  : result.compliance === 'tier1'
                    ? 'Tier 1 Deficit'
                    : 'Tier 2 Deficit'}
              </Badge>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Attained GFI</p>
                  <p className="text-2xl font-bold" data-testid="text-attained-gfi">
                    {result.attainedGFI.toFixed(2)} gCO₂eq/MJ
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Direct Compliance Target</p>
                  <p className="text-2xl font-bold" data-testid="text-direct-target">
                    {result.directTarget.toFixed(2)} gCO₂eq/MJ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Base Target</p>
                  <p className="text-xl font-semibold" data-testid="text-base-target">
                    {result.baseTarget.toFixed(2)} gCO₂eq/MJ
                  </p>
                </div>
                {result.surplus > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Surplus Units</p>
                    <p className="text-xl font-semibold text-green-600" data-testid="text-surplus">
                      {result.surplus.toFixed(2)} tCO₂eq
                    </p>
                  </div>
                )}
              </div>

              {(result.tier1Deficit > 0 || result.tier2Deficit > 0) && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold">Penalty Breakdown</h4>

                  {result.tier1Deficit > 0 && (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Tier 1 Deficit ($100/tCO₂eq)</p>
                        <p className="text-xs text-muted-foreground">
                          {result.tier1Deficit.toFixed(2)} tCO₂eq
                        </p>
                      </div>
                      <p className="text-lg font-bold text-amber-600" data-testid="text-tier1-cost">
                        ${result.tier1Cost.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {result.tier2Deficit > 0 && (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Tier 2 Deficit ($380/tCO₂eq)</p>
                        <p className="text-xs text-muted-foreground">
                          {result.tier2Deficit.toFixed(2)} tCO₂eq
                        </p>
                      </div>
                      <p className="text-lg font-bold text-destructive" data-testid="text-tier2-cost">
                        ${result.tier2Cost.toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t pt-3">
                    <p className="font-semibold">Total IMO GFI Penalty</p>
                    <p className="text-xl font-bold" data-testid="text-total-gfi-penalty">
                      ${(result.tier1Cost + result.tier2Cost).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {recommendation && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Optimization Result
            </h4>
            <p className="text-green-800 mt-2">{recommendation.message}</p>
          </div>
        )}
      </CardContent>
    </Card >
  );
}
