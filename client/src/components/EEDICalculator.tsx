import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eediInputSchema, type EEDIInput, type EngineRow } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { LockableInput } from "@/components/ui/lockable-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Zap } from "lucide-react";
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
  const [optimizedSpeed, setOptimizedSpeed] = useState<number | null>(null);
  const [lockedFields, setLockedFields] = useState<Record<string, boolean>>({});

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

  // Watch values for inputs
  const referenceSpeed = form.watch("referenceSpeed");
  const capacity = form.watch("capacity");

  const handleCalculate = (data: EEDIInput) => {
    setError(null);
    setResult(null);
    setOptimizedSpeed(null);

    const mainEnginesList = (data.mainEngines as EngineRow[]) || [];
    const auxiliaryEnginesList = (data.auxiliaryEngines as EngineRow[]) || [];

    const hasValidMainEngine = mainEnginesList.some(e => e.power > 0 && e.sfc > 0);
    const hasValidAuxEngine = auxiliaryEnginesList.some(e => e.power > 0 && e.sfc > 0);

    if (!hasValidMainEngine && !hasValidAuxEngine) {
      setError("Please add at least one engine with power > 0 kW and SFC > 0 g/kWh");
      return;
    }

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
      setError(null);
      if (onResultCalculated) {
        onResultCalculated(calculatedResult);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown calculation error';
      setError(errorMessage);
      setResult(null);
      console.error("EEDI calculation error:", err);
    }
  };

  const handleOptimize = () => {
    if (!result || result.compliant) return;

    // Iteratively find max compliant speed if unlocked
    const isSpeedLocked = lockedFields["referenceSpeed"];

    if (isSpeedLocked) {
      setError("Cannot optimize: Reference Speed is locked. Please unlock it or adjust other parameters manually.");
      return;
    }

    // Binary search for max speed that satisfies EEDI <= Required
    let low = 0;
    let high = form.getValues().referenceSpeed;
    let optimal = high;

    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      const attained = calculateEEDIFromEngines(
        mainEngines,
        auxiliaryEngines,
        mid,
        // @ts-ignore
        form.getValues().capacity
      );

      if (attained <= result.required) {
        optimal = mid;
        low = mid; // Try to go higher
      } else {
        high = mid; // Needs to be lower
      }
    }

    setOptimizedSpeed(optimal);
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
                <LockableInput
                  id="referenceSpeed"
                  type="number"
                  step="0.01"
                  {...form.register("referenceSpeed", {
                    valueAsNumber: true,
                    required: "Reference speed is required",
                    min: { value: 0.01, message: "Speed must be greater than 0" }
                  })}
                  value={referenceSpeed || ""}
                  placeholder="e.g., 14.5"
                  onFocus={(e) => e.target.select()}
                  isLocked={lockedFields["referenceSpeed"]}
                  onLockChange={(locked) => setLockedFields(prev => ({ ...prev, referenceSpeed: locked }))}
                />
                {form.formState.errors.referenceSpeed && (
                  <p className="text-sm text-destructive">{form.formState.errors.referenceSpeed.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (DWT) *</Label>
                <LockableInput
                  id="capacity"
                  type="number"
                  step="0.01"
                  {...form.register("capacity", {
                    valueAsNumber: true,
                    required: "Capacity is required",
                    min: { value: 0.01, message: "Capacity must be greater than 0" }
                  })}
                  value={capacity || ""}
                  placeholder="e.g., 85000"
                  onFocus={(e) => e.target.select()}
                  isLocked={lockedFields["capacity"]}
                  onLockChange={(locked) => setLockedFields(prev => ({ ...prev, capacity: locked }))}
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

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
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
              {result && !result.compliant && (
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={handleOptimize}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Optimize Unlocked Inputs
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card data-testid="card-eedi-results">
          <CardHeader>
            <CardTitle>EEDI Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
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
                  <div className="mt-2 text-2xl">
                    <ComplianceBadge status={result.compliant ? "compliant" : "non-compliant"} />
                  </div>
                </div>
              </div>

              {optimizedSpeed && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Optimization Recommendation
                  </h4>
                  <p className="text-green-800 mt-2">
                    To achieve compliance, reduce reference speed to max <strong>{optimizedSpeed.toFixed(2)} knots</strong>.
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
