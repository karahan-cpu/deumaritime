import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ciiInputSchema, fuelTypes, type CIIInput } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { calculateCII, calculateRequiredCII, getCIIRating } from "@/lib/calculations";
import { CIIRatingDisplay } from "./CIIRatingDisplay";
import { CIIOptimizationDialog } from "./CIIOptimizationDialog";

interface CIICalculatorProps {
  shipType: string;
  onResultCalculated?: (result: { attained: number; required: number; rating: "A" | "B" | "C" | "D" | "E" }) => void;
}

export function CIICalculator({ shipType, onResultCalculated }: CIICalculatorProps) {
  const [result, setResult] = useState<{
    attained: number;
    required: number;
    rating: "A" | "B" | "C" | "D" | "E";
  } | null>(null);
  const [optimizationOpen, setOptimizationOpen] = useState(false);

  const form = useForm<CIIInput>({
    resolver: zodResolver(ciiInputSchema),
    defaultValues: {
      annualFuelConsumption: undefined,
      distanceTraveled: undefined,
      capacity: undefined,
      fuelType: "HFO",
      year: undefined,
    },
  });

  const handleCalculate = (data: CIIInput) => {
    const attained = calculateCII(
      data.annualFuelConsumption,
      data.distanceTraveled,
      data.capacity,
      data.fuelType
    );

    const required = calculateRequiredCII(shipType, data.capacity, data.year);
    const rating = getCIIRating(attained, required);

    const calculatedResult = { attained, required, rating: rating as any };
    setResult(calculatedResult);
    if (onResultCalculated) {
      onResultCalculated(calculatedResult);
    }
    console.log("CII calculated:", calculatedResult);
  };

  const currentFormValues = form.watch();

  return (
    <div className="space-y-6">
      <Card data-testid="card-cii-calculator">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingDown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>CII Calculator</CardTitle>
                <CardDescription>Annual Carbon Intensity Indicator (A-E Rating)</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs uppercase">Annual Rating</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleCalculate)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="annualFuelConsumption">Annual Fuel Consumption (tonnes)</Label>
                <Input
                  id="annualFuelConsumption"
                  type="number"
                  step="0.01"
                  {...form.register("annualFuelConsumption", { valueAsNumber: true })}
                  placeholder="e.g., 18500"
                  data-testid="input-fuel-consumption"
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distanceTraveled">Distance Traveled (nautical miles)</Label>
                <Input
                  id="distanceTraveled"
                  type="number"
                  step="0.01"
                  {...form.register("distanceTraveled", { valueAsNumber: true })}
                  placeholder="e.g., 95000"
                  data-testid="input-distance-traveled"
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (DWT)</Label>
                <Input
                  id="capacity"
                  type="number"
                  step="0.01"
                  {...form.register("capacity", { valueAsNumber: true })}
                  placeholder="e.g., 85000"
                  data-testid="input-cii-capacity"
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select
                  value={form.watch("fuelType")}
                  onValueChange={(value) => form.setValue("fuelType", value)}
                >
                  <SelectTrigger data-testid="select-cii-fuel-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((fuel) => (
                      <SelectItem key={fuel.value} value={fuel.value}>
                        {fuel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Reporting Year</Label>
                <Input
                  id="year"
                  type="number"
                  {...form.register("year", { valueAsNumber: true })}
                  placeholder="e.g., 2025"
                  data-testid="input-cii-year"
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button type="submit" className="w-full" data-testid="button-calculate-cii">
                Calculate CII Rating
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!result}
                onClick={() => setOptimizationOpen(true)}
                data-testid="button-optimize-cii"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Optimize for Better Rating
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <>
          <CIIRatingDisplay
            rating={result.rating}
            attainedCII={result.attained}
            requiredCII={result.required}
          />

          <CIIOptimizationDialog
            open={optimizationOpen}
            onOpenChange={setOptimizationOpen}
            currentParams={{
              annualFuelConsumption: currentFormValues.annualFuelConsumption,
              distanceTraveled: currentFormValues.distanceTraveled,
              capacity: currentFormValues.capacity,
              fuelType: currentFormValues.fuelType,
              year: currentFormValues.year,
            }}
            shipType={shipType}
            currentRating={result.rating}
          />
        </>
      )}
    </div>
  );
}
