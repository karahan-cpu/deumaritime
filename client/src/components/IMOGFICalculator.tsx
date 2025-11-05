import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { imoGFIInputSchema, type IMOGFIInput } from "@shared/schema";
import { calculateIMOGFI } from "@/lib/calculations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function IMOGFICalculator({ onCalculate }: { 
  onCalculate?: (result: ReturnType<typeof calculateIMOGFI>) => void 
}) {
  const [result, setResult] = useState<ReturnType<typeof calculateIMOGFI> | null>(null);

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
    onCalculate?.(calculationResult);
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
                    <Input
                      type="number"
                      placeholder="e.g., 404000000"
                      data-testid="input-total-energy"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                    <Input
                      type="number"
                      placeholder="e.g., 36764000000"
                      data-testid="input-ghg-emissions"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                    <Input
                      type="number"
                      placeholder="2028"
                      min={2028}
                      max={2050}
                      data-testid="input-year"
                      {...field}
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
      </CardContent>
    </Card>
  );
}
