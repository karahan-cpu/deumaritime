import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fuelCostInputSchema, type FuelCostInput, fuelTypes } from "@shared/schema";
import { calculateFuelCost } from "@/lib/calculations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FuelCostCalculator({ onCalculate }: { 
  onCalculate?: (result: ReturnType<typeof calculateFuelCost>) => void 
}) {
  const [result, setResult] = useState<ReturnType<typeof calculateFuelCost> | null>(null);

  const form = useForm<FuelCostInput>({
    resolver: zodResolver(fuelCostInputSchema),
    defaultValues: {
      mainEnginePower: 0,
      auxiliaryPower: 0,
      daysAtSea: 0,
      daysInPort: 0,
      fuelType: "HFO",
      fuelPrice: 550,
    },
  });

  const onSubmit = (data: FuelCostInput) => {
    const calculationResult = calculateFuelCost(
      data.mainEnginePower,
      data.auxiliaryPower,
      data.daysAtSea,
      data.daysInPort,
      data.fuelType,
      data.fuelPrice
    );
    setResult(calculationResult);
    onCalculate?.(calculationResult);
  };

  return (
    <Card data-testid="card-fuel-cost-calculator">
      <CardHeader>
        <CardTitle>Annual Fuel Cost Calculator</CardTitle>
        <CardDescription>
          Calculate annual fuel costs using SFOC-based consumption method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mainEnginePower"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Engine Power (kW MCR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 9930"
                      data-testid="input-main-engine-power"
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
              name="auxiliaryPower"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auxiliary Engine Power (kW)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 500"
                      data-testid="input-auxiliary-power"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="daysAtSea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days at Sea per Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 300"
                        data-testid="input-days-at-sea"
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
                name="daysInPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days in Port per Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 65"
                        data-testid="input-days-in-port"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fuelType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuel Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    data-testid="select-fuel-type"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fuelTypes.map((fuel) => (
                        <SelectItem key={fuel.value} value={fuel.value}>
                          {fuel.label}
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
              name="fuelPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuel Price ($/MT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 550"
                      data-testid="input-fuel-price"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Typical 2025 prices: HFO $450-580, VLSFO $580-650, MDO/MGO $650-800
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" data-testid="button-calculate-fuel-cost">
              Calculate Annual Fuel Cost
            </Button>
          </form>
        </Form>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Annual Fuel Consumption & Cost</h3>
            </div>

            <div className="grid gap-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Main Engine Consumption</p>
                  <p className="text-xs text-muted-foreground">At 75% MCR</p>
                </div>
                <p className="text-lg font-semibold" data-testid="text-main-consumption">
                  {result.mainEngineConsumption.toFixed(2)} MT
                </p>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Auxiliary Engine Consumption</p>
                  <p className="text-xs text-muted-foreground">At sea + in port</p>
                </div>
                <p className="text-lg font-semibold" data-testid="text-auxiliary-consumption">
                  {result.auxiliaryConsumption.toFixed(2)} MT
                </p>
              </div>

              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div>
                  <p className="text-sm font-medium">Total Annual Consumption</p>
                </div>
                <p className="text-lg font-semibold" data-testid="text-total-consumption">
                  {result.totalConsumption.toFixed(2)} MT
                </p>
              </div>

              <div className="flex justify-between items-center p-4 bg-card rounded-lg border-2">
                <div>
                  <p className="font-semibold">Total Annual Fuel Cost</p>
                  <p className="text-xs text-muted-foreground">
                    {result.totalConsumption.toFixed(2)} MT × ${form.getValues('fuelPrice')}/MT
                  </p>
                </div>
                <p className="text-3xl font-bold" data-testid="text-total-fuel-cost">
                  ${result.totalCost.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <p className="font-semibold mb-1">Calculation Method:</p>
              <p>
                SFOC: Main engine {form.getValues('fuelType') === 'HFO' ? '175' : '185'} g/kWh, 
                Auxiliary 220 g/kWh. Main engine at 75% MCR, auxiliary at 50% at sea, 30% in port.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
