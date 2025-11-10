import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eexiInputSchema, type EEXIInput, type EngineRow } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FileText } from "lucide-react";
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

  const form = useForm<EEXIInput>({
    resolver: zodResolver(eexiInputSchema),
    defaultValues: {
      speed: 0,
      capacity: 0,
      hasEPL: false,
      mainEngines: [{ power: 0, sfc: 190, fuelType: "HFO" }],
      auxiliaryEngines: [],
    },
  });

  const mainEngines = (form.watch("mainEngines") as EngineRow[]) || [];
  const auxiliaryEngines = (form.watch("auxiliaryEngines") as EngineRow[]) || [];

  const handleCalculate = (data: EEXIInput) => {
    const mainEnginesList = (data.mainEngines as EngineRow[]) || [];
    const auxiliaryEnginesList = (data.auxiliaryEngines as EngineRow[]) || [];

    // Check if there's at least one engine with valid power
    const hasValidMainEngine = mainEnginesList.some(e => e.power > 0 && e.sfc > 0);
    const hasValidAuxEngine = auxiliaryEnginesList.some(e => e.power > 0 && e.sfc > 0);

    if (!hasValidMainEngine && !hasValidAuxEngine) {
      return; // Cannot calculate without valid engines
    }

    if (data.speed <= 0 || data.capacity <= 0) {
      return; // Cannot calculate without speed and capacity
    }

    const attained = calculateEEXIFromEngines(
      mainEnginesList,
      auxiliaryEnginesList,
      data.speed,
      data.capacity,
      data.hasEPL
    );

    const required = calculateRequiredEEXI(shipType, data.capacity, Math.max(new Date().getFullYear(), yearBuilt));
    const compliant = attained <= required;

    const calculatedResult = { attained, required, compliant };
    setResult(calculatedResult);
    if (onResultCalculated) onResultCalculated(calculatedResult);
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
                <Label htmlFor="speed">Reference Speed (knots)</Label>
                <Input id="speed" type="number" step="0.01" {...form.register("speed", { valueAsNumber: true })} placeholder="e.g., 14.5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (DWT)</Label>
                <Input id="capacity" type="number" step="0.01" {...form.register("capacity", { valueAsNumber: true })} placeholder="e.g., 85000" />
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

            <Button 
              type="submit" 
              className="w-full" 
              data-testid="button-calculate-eexi" 
              disabled={
                (mainEngines.length === 0 && auxiliaryEngines.length === 0) ||
                (!mainEngines.some(e => e.power > 0 && e.sfc > 0) && !auxiliaryEngines.some(e => e.power > 0 && e.sfc > 0)) ||
                form.watch("speed") <= 0 ||
                form.watch("capacity") <= 0
              }
            >
              Calculate EEXI
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card data-testid="card-eexi-results">
          <CardHeader>
            <CardTitle>EEXI Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
