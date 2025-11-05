import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shipbuildingCostInputSchema, type ShipbuildingCostInput, shipTypes } from "@shared/schema";
import { calculateShipbuildingCost } from "@/lib/calculations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function ShipbuildingCostCalculator({ onCalculate }: { 
  onCalculate?: (cost: number) => void 
}) {
  const [result, setResult] = useState<number | null>(null);

  const form = useForm<ShipbuildingCostInput>({
    resolver: zodResolver(shipbuildingCostInputSchema),
    defaultValues: {
      deadweight: 0,
      grossTonnage: 0,
      shipType: "Bulk Carrier",
      isNewBuild: true,
    },
  });

  const onSubmit = (data: ShipbuildingCostInput) => {
    const cost = calculateShipbuildingCost(
      data.deadweight,
      data.grossTonnage,
      data.shipType,
      data.isNewBuild
    );
    setResult(cost);
    onCalculate?.(cost);
  };

  return (
    <Card data-testid="card-shipbuilding-calculator">
      <CardHeader>
        <CardTitle>Shipbuilding Cost Estimator</CardTitle>
        <CardDescription>
          Parametric cost estimation for newbuild vessels based on DWT and ship type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deadweight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadweight (DWT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 75000"
                      data-testid="input-deadweight"
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
              name="grossTonnage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gross Tonnage (GT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 45000"
                      data-testid="input-gross-tonnage"
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
              name="shipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ship Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    data-testid="select-ship-type"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ship type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {shipTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isNewBuild"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-new-build"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>New Build Vessel</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check if this is a new build (uncheck for existing vessels, which have $0 construction cost)
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" data-testid="button-calculate-shipbuilding">
              Calculate Shipbuilding Cost
            </Button>
          </form>
        </Form>

        {result !== null && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Estimated Cost</h3>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Shipbuilding Cost</p>
                  {result === 0 ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      Existing vessel - no construction cost
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on parametric estimation
                    </p>
                  )}
                </div>
                <p className="text-3xl font-bold" data-testid="text-shipbuilding-cost">
                  ${result.toLocaleString()}
                </p>
              </div>
            </div>

            {result > 0 && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <p className="font-semibold mb-1">Note:</p>
                <p>
                  This is a parametric estimate based on industry benchmarks ($650-$1200 per DWT 
                  depending on vessel type). Actual costs vary based on specifications, equipment, 
                  shipyard location, and market conditions.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
