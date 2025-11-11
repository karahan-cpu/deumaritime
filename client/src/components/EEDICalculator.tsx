import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eediInputSchema, fuelTypes, type EEDIInput } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { useState } from "react";
import { calculateEEDI, calculateRequiredEEDI } from "@/lib/calculations";
import { ComplianceBadge } from "./ComplianceBadge";

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
      mainEnginePower: 0,
      mainEngineSFC: 190,
      auxiliaryPower: 0,
      auxiliarySFC: 215,
      referenceSpeed: 0,
      capacity: 0,
      fuelType: "HFO",
      engineInfo: { engineType: 'two_stroke', count: 1 },
    },
    mode: "onChange",
  });

  const handleCalculate = (data: EEDIInput) => {
    setError(null); // Clear previous errors
    setResult(null); // Clear previous results

    // Validate that at least one engine has power
    if (data.mainEnginePower <= 0 && data.auxiliaryPower <= 0) {
      setError("Please enter at least one engine with power > 0");
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
      const attained = calculateEEDI(
        data.mainEnginePower || 0,
        data.mainEngineSFC || 190,
        data.auxiliaryPower || 0,
        data.auxiliarySFC || 215,
        data.referenceSpeed,
        data.capacity,
        data.fuelType
      );

      if (!isFinite(attained) || attained <= 0) {
        setError("Invalid calculation result. Please check your inputs.");
        return;
      }

      const required = calculateRequiredEEDI(shipType, data.capacity, yearBuilt);
      const compliant = attained <= required;

      const calculatedResult = { attained, required, compliant };
      
      // Debug logging (can be removed in production)
      console.log("EEDI Calculation:", {
        mainPower: data.mainEnginePower,
        mainSFC: data.mainEngineSFC,
        auxPower: data.auxiliaryPower,
        auxSFC: data.auxiliarySFC,
        speed: data.referenceSpeed,
        capacity: data.capacity,
        fuelType: data.fuelType,
        attained,
        required,
        compliant,
      });
      
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
                <Label htmlFor="mainEnginePower">Main Engine Power (kW MCR) *</Label>
                <Input
                  id="mainEnginePower"
                  type="number"
                  step="0.01"
                  {...form.register("mainEnginePower", { valueAsNumber: true })}
                  placeholder="e.g., 12500"
                  data-testid="input-main-engine-power"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">Maximum Continuous Rating</p>
                {form.formState.errors.mainEnginePower && (
                  <p className="text-sm text-destructive">{form.formState.errors.mainEnginePower.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainEngineSFC">Main Engine SFC (g/kWh) *</Label>
                <Input
                  id="mainEngineSFC"
                  type="number"
                  step="0.01"
                  {...form.register("mainEngineSFC", { valueAsNumber: true })}
                  placeholder="Default: 190"
                  data-testid="input-main-sfc"
                  min="0.01"
                />
                <p className="text-xs text-muted-foreground">At 75% MCR reference condition</p>
                {form.formState.errors.mainEngineSFC && (
                  <p className="text-sm text-destructive">{form.formState.errors.mainEngineSFC.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="auxiliaryPower">Auxiliary Power (kW MCR)</Label>
                <Input
                  id="auxiliaryPower"
                  type="number"
                  step="0.01"
                  {...form.register("auxiliaryPower", { valueAsNumber: true })}
                  placeholder="e.g., 850"
                  data-testid="input-aux-power"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">Maximum Continuous Rating</p>
                {form.formState.errors.auxiliaryPower && (
                  <p className="text-sm text-destructive">{form.formState.errors.auxiliaryPower.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="auxiliarySFC">Auxiliary SFC (g/kWh)</Label>
                <Input
                  id="auxiliarySFC"
                  type="number"
                  step="0.01"
                  {...form.register("auxiliarySFC", { valueAsNumber: true })}
                  placeholder="Default: 215"
                  data-testid="input-aux-sfc"
                  min="0.01"
                />
                <p className="text-xs text-muted-foreground">At 50% MCR reference condition</p>
                {form.formState.errors.auxiliarySFC && (
                  <p className="text-sm text-destructive">{form.formState.errors.auxiliarySFC.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceSpeed">Reference Speed (knots) *</Label>
                <Input
                  id="referenceSpeed"
                  type="number"
                  step="0.01"
                  {...form.register("referenceSpeed", { valueAsNumber: true })}
                  placeholder="e.g., 14.5"
                  data-testid="input-reference-speed"
                  min="0.01"
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
                  {...form.register("capacity", { valueAsNumber: true })}
                  placeholder="e.g., 85000"
                  data-testid="input-capacity"
                  min="0.01"
                />
                {form.formState.errors.capacity && (
                  <p className="text-sm text-destructive">{form.formState.errors.capacity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select
                  value={form.watch("fuelType")}
                  onValueChange={(value) => form.setValue("fuelType", value)}
                >
                  <SelectTrigger data-testid="select-fuel-type">
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
            </div>

            <div className="space-y-3 pt-2 border-t">
              <h4 className="font-semibold">Main Engine</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Engine Type</Label>
                  <Select value={form.watch("engineInfo.engineType") || 'two_stroke'} onValueChange={(v) => form.setValue("engineInfo", { ...(form.getValues("engineInfo") || { count: 1 }), engineType: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="two_stroke">2‑stroke</SelectItem>
                      <SelectItem value="four_stroke">4‑stroke</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Engine Count</Label>
                  <Input type="number" value={form.watch("engineInfo.count") ?? 1} onChange={(e) => form.setValue("engineInfo", { ...(form.getValues("engineInfo") || {}), count: parseInt(e.target.value || '1', 10) })} />
                </div>
                <div className="space-y-1">
                  <Label>Manufacturer</Label>
                  <Input value={form.watch("engineInfo.manufacturer") || ''} onChange={(e) => form.setValue("engineInfo", { ...(form.getValues("engineInfo") || {}), manufacturer: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Model</Label>
                  <Input value={form.watch("engineInfo.model") || ''} onChange={(e) => form.setValue("engineInfo", { ...(form.getValues("engineInfo") || {}), model: e.target.value })} />
                </div>
              </div>
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
                (form.watch("mainEnginePower") <= 0 && form.watch("auxiliaryPower") <= 0) ||
                form.watch("referenceSpeed") <= 0 ||
                form.watch("capacity") <= 0
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
