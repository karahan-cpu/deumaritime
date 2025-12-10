import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eediInputSchema, type EEDIInput, type EngineRow } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { useState } from "react";
import { calculateEEDIFromEngines, calculateRequiredEEDI } from "@/lib/calculations";
import { ComplianceBadge } from "./ComplianceBadge";
import { EngineRowsList } from "./EngineRowsList";

interface EEDICalculatorProps {
  shipType: string;
  isNewBuild: boolean;
  yearBuilt: number;
  onResultCalculated?: (result: { attained: number; required: number; compliant: boolean }) => void;
}

export function EEDICalculator({ shipType, isNewBuild, yearBuilt, onResultCalculated }: EEDICalculatorProps) {
  const [result, setResult] = useState<{
    attained: number;
    required: number;
    compliant: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EEDIInput>({
    resolver: zodResolver(eediInputSchema),
    defaultValues: {
      referenceSpeed: undefined,
      capacity: undefined,
      mainEngines: [{ power: 0, sfc: 190, fuelType: "HFO" }],
      auxiliaryEngines: [],
    },
    mode: "onChange",
  });

  const mainEngines = (form.watch("mainEngines") as EngineRow[]) || [];
  const auxiliaryEngines = (form.watch("auxiliaryEngines") as EngineRow[]) || [];

  const handleCalculate = (data: EEDIInput) => {
    setError(null); // Clear previous errors
    setResult(null); // Clear previous results

    const mainEnginesList = (data.mainEngines as EngineRow[]) || [];
    const auxiliaryEnginesList = (data.auxiliaryEngines as EngineRow[]) || [];

    // Check if there's at least one engine with valid power
    const hasValidMainEngine = mainEnginesList.some(e => e.power > 0 && e.sfc > 0);
    const hasValidAuxEngine = auxiliaryEnginesList.some(e => e.power > 0 && e.sfc > 0);

    if (!hasValidMainEngine && !hasValidAuxEngine) {
      setError("Please add at least one engine with power > 0 kW and SFC > 0 g/kWh");
      return;
    }

    // Validate speed and capacity
    if (!data.referenceSpeed || data.referenceSpeed <= 0) {
      setError("Reference speed must be greater than 0");
      form.setError("referenceSpeed", { message: "Reference speed must be greater than 0" });
      return;
    }

    if (!data.capacity || data.capacity <= 0) {
      setError("Capacity must be greater than 0");
      form.setError("capacity", { message: "Capacity must be greater than 0" });
      return;
    }

    try {
      const attained = calculateEEDIFromEngines(
        mainEnginesList,
        auxiliaryEnginesList,
        data.referenceSpeed,
        data.capacity
      );

      if (!isFinite(attained) || attained <= 0) {
        setError("Invalid calculation result. Please check your inputs.");
        return;
      }

      const required = calculateRequiredEEDI(shipType, data.capacity, yearBuilt);
      const compliant = attained <= required;

      const calculatedResult = { attained, required, compliant };

      setResult(calculatedResult);
      setError(null); // Clear any previous errors on success
      if (onResultCalculated) {
        onResultCalculated(calculatedResult);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown calculation error';
      setError(errorMessage);
      setResult(null); // Clear results on error
      console.error("EEDI calculation error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-eedi-calculator">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>EEDI Calculator</CardTitle>
                <CardDescription>Energy Efficiency Design Index for new build ships</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs uppercase">Phase 3: 30% Reduction</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleCalculate)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="referenceSpeed">Reference Speed (knots) *</Label>
                <Input
                  id="referenceSpeed"
                  type="number"
                  step="0.01"
                  {...form.register("referenceSpeed", {
                    valueAsNumber: true,
                    required: "Reference speed is required",
                    min: { value: 0.01, message: "Speed must be greater than 0" }
                  })}
                  placeholder="e.g., 14.5"
                  data-testid="input-reference-speed"
                  min="0.01"
                  onFocus={(e) => e.target.select()}
                />
                {form.formState.errors.referenceSpeed && (
                  <p className="text-sm text-destructive">{form.formState.errors.referenceSpeed.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (DWT) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  step="0.01"
                  {...form.register("capacity", {
                    valueAsNumber: true,
                    required: "Capacity is required",
                    min: { value: 0.01, message: "Capacity must be greater than 0" }
                  })}
                  placeholder="e.g., 85000"
                  data-testid="input-capacity"
                  min="0.01"
                  onFocus={(e) => e.target.select()}
                />
                {form.formState.errors.capacity && (
                  <p className="text-sm text-destructive">{form.formState.errors.capacity.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <EngineRowsList
                title="Main Engines"
                value={mainEngines}
                onChange={(rows) => form.setValue("mainEngines", rows as any, { shouldDirty: true })}
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <EngineRowsList
                title="Auxiliary Engines"
                value={auxiliaryEngines}
                onChange={(rows) => form.setValue("auxiliaryEngines", rows as any, { shouldDirty: true })}
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              data-testid="button-calculate-eedi"
              disabled={
                (mainEngines.length === 0 && auxiliaryEngines.length === 0) ||
                (!mainEngines.some(e => e.power > 0 && e.sfc > 0) && !auxiliaryEngines.some(e => e.power > 0 && e.sfc > 0)) ||
                !form.watch("referenceSpeed") || form.watch("referenceSpeed") <= 0 ||
                !form.watch("capacity") || form.watch("capacity") <= 0
              }
            >
              Calculate EEDI
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card data-testid="card-eedi-results">
          <CardHeader>
            <CardTitle>EEDI Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Attained EEDI</div>
                  <div className="text-3xl font-bold font-mono">{result.attained.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">gCO₂/tonne-nm</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Required EEDI</div>
                  <div className="text-3xl font-bold font-mono">{result.required.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">gCO₂/tonne-nm</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Compliance Status</div>
                  <div className="mt-2">
                    <ComplianceBadge status={result.compliant ? "compliant" : "non-compliant"} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.compliant ? "Meets Phase 3 requirements" : "Does not meet requirements"}
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
