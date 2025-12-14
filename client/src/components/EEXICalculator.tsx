import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eexiInputSchema, type EEXIInput, type EngineRow } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { LockableInput } from "@/components/ui/lockable-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FileText, Zap } from "lucide-react";
import { useState } from "react";
import { calculateEEXIFromEngines, calculateRequiredEEXI } from "@/lib/calculations";
import { ComplianceBadge } from "./ComplianceBadge";
import { EngineRowsList } from "./EngineRowsList";

interface EEXICalculatorProps {
  shipType: string;
  yearBuilt: number;
  onResultCalculated?: (result: { attained: number; required: number; compliant: boolean }) => void;
}

export function EEXICalculator({ shipType, yearBuilt, onResultCalculated }: EEXICalculatorProps) {
  const [result, setResult] = useState<{
    attained: number;
    required: number;
    compliant: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<{ message: string, value?: number } | null>(null);
  const [lockedFields, setLockedFields] = useState<Record<string, boolean>>({});

  const form = useForm<EEXIInput>({
    resolver: zodResolver(eexiInputSchema),
    defaultValues: {
      speed: undefined,
      capacity: undefined,
      hasEPL: false,
      mainEngines: [{ power: 0, sfc: 190, fuelType: "HFO" }],
      auxiliaryEngines: [],
    },
    mode: "onChange",
  });

  const mainEngines = (form.watch("mainEngines") as EngineRow[]) || [];
  const auxiliaryEngines = (form.watch("auxiliaryEngines") as EngineRow[]) || [];

  // Watch values
  const speed = form.watch("speed");
  const capacity = form.watch("capacity");

  const handleCalculate = (data: EEXIInput) => {
    setError(null);
    setResult(null);
    setRecommendation(null);

    const mainEnginesList = (data.mainEngines as EngineRow[]) || [];
    const auxiliaryEnginesList = (data.auxiliaryEngines as EngineRow[]) || [];

    const hasValidMainEngine = mainEnginesList.some(e => e.power > 0 && e.sfc > 0);
    const hasValidAuxEngine = auxiliaryEnginesList.some(e => e.power > 0 && e.sfc > 0);

    if (!hasValidMainEngine && !hasValidAuxEngine) {
      setError("Please add at least one engine with power > 0 kW and SFC > 0 g/kWh");
      return;
    }

    if (!data.speed || data.speed <= 0) {
      setError("Reference speed must be greater than 0");
      form.setError("speed", { message: "Reference speed must be greater than 0" });
      return;
    }

    if (!data.capacity || data.capacity <= 0) {
      setError("Capacity must be greater than 0");
      form.setError("capacity", { message: "Capacity must be greater than 0" });
      return;
    }

    try {
      const calculationYear = Math.max(new Date().getFullYear(), yearBuilt);
      const attained = calculateEEXIFromEngines(
        mainEnginesList,
        auxiliaryEnginesList,
        data.speed,
        data.capacity,
        data.hasEPL
      );

      const required = calculateRequiredEEXI(shipType, data.capacity, calculationYear);
      const compliant = attained <= required;

      const calculatedResult = { attained, required, compliant };

      setResult(calculatedResult);
      setError(null);
      if (onResultCalculated) onResultCalculated(calculatedResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown calculation error';
      setError(errorMessage);
      setResult(null);
      console.error("EEXI calculation error:", err);
    }
  };

  const handleOptimize = () => {
    if (!result || result.compliant) return;

    // 1. Suggest EPL if not locked and not enabled
    // Note: We don't have a "Lock" UI for the switch, but we could add one.
    // For now, checks if speed is locked.

    // If speed is locked, we can't optimize speed.
    // If EPL is off, we can suggest EPL.
    const isSpeedLocked = lockedFields["speed"];
    const hasEPL = form.getValues().hasEPL;

    // If speed is locked and EPL is already on (or we don't want to force it), we can't do much.
    // But if EPL is off, we can suggest it regardless of speed lock, as it's a separate lever?
    // User asked to "optimize unlocked inputs". 
    // Let's assume enabling EPL is "unlocking" a new lever. 
    // But usually EPL is a retrofit decision.

    if (!hasEPL) {
      // Just suggest EPL first
      setRecommendation({
        message: "Consider enabling Engine Power Limitation (EPL). This will apply an 83% derating factor to your main engines."
      });
      return;
    }

    if (isSpeedLocked) {
      setRecommendation({
        message: "Speed input is locked. Cannot optimize speed. Please unlock Reference Speed to calculate required reduction."
      });
      return;
    }

    // If EPL is already on (or user ignored it), suggest speed reduction
    let low = 0;
    let high = form.getValues().speed;
    let optimal = high;

    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      const attained = calculateEEXIFromEngines(
        mainEngines,
        auxiliaryEngines,
        mid,
        // @ts-ignore
        form.getValues().capacity,
        true // assume EPL is kept on or we forced it
      );

      if (attained <= result.required) {
        optimal = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    setRecommendation({
      message: `Limit reference speed to ${optimal.toFixed(2)} knots to achieve compliance.`,
      value: optimal
    });
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-eexi-calculator">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>EEXI Calculator</CardTitle>
                <CardDescription>Energy Efficiency Existing Ship Index</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs uppercase">EEXI Baseline</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleCalculate)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="speed">Reference Speed (knots) *</Label>
                <LockableInput
                  id="speed"
                  type="number"
                  step="0.01"
                  {...form.register("speed", {
                    valueAsNumber: true,
                    required: "Reference speed is required",
                    min: { value: 0.01, message: "Speed must be greater than 0" }
                  })}
                  value={speed || ""}
                  placeholder="e.g., 14.5"
                  onFocus={(e) => e.target.select()}
                  isLocked={lockedFields["speed"]}
                  onLockChange={(locked) => setLockedFields(prev => ({ ...prev, speed: locked }))}
                />
                {form.formState.errors.speed && (
                  <p className="text-sm text-destructive">{form.formState.errors.speed.message}</p>
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

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-1">
                <Label htmlFor="hasEPL">EPL (Engine Power Limitation)</Label>
                <p className="text-xs text-muted-foreground">Apply 83% derating when enabled</p>
              </div>
              <Switch id="hasEPL" checked={form.watch("hasEPL")} onCheckedChange={(v) => form.setValue("hasEPL", v)} />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                data-testid="button-calculate-eexi"
                disabled={
                  (mainEngines.length === 0 && auxiliaryEngines.length === 0) ||
                  (!mainEngines.some(e => e.power > 0 && e.sfc > 0) && !auxiliaryEngines.some(e => e.power > 0 && e.sfc > 0)) ||
                  !form.watch("speed") || form.watch("speed") <= 0 ||
                  !form.watch("capacity") || form.watch("capacity") <= 0
                }
              >
                Calculate EEXI
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
        <Card data-testid="card-eexi-results">
          <CardHeader>
            <CardTitle>EEXI Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Attained EEXI</div>
                  <div className="text-3xl font-bold font-mono">{result.attained.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">gCO₂/tonne-nm</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Required EEXI</div>
                  <div className="text-3xl font-bold font-mono">{result.required.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">gCO₂/tonne-nm</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-2">
                    <ComplianceBadge status={result.compliant ? "compliant" : "non-compliant"} />
                  </div>
                </div>
              </div>

              {recommendation && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Optimization Recommendation
                  </h4>
                  <p className="text-green-800 mt-2">
                    {recommendation.message}
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
