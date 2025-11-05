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
    },
  });

  const handleCalculate = (data: EEDIInput) => {
    const attained = calculateEEDI(
      data.mainEnginePower,
      data.mainEngineSFC,
      data.auxiliaryPower,
      data.auxiliarySFC,
      data.referenceSpeed,
      data.capacity,
      data.fuelType
    );

    const required = calculateRequiredEEDI(shipType, data.capacity, yearBuilt);
    const compliant = attained <= required;

    const calculatedResult = { attained, required, compliant };
    setResult(calculatedResult);
    if (onResultCalculated) {
      onResultCalculated(calculatedResult);
    }
    console.log("EEDI calculated:", calculatedResult);
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
                <Label htmlFor="mainEnginePower">Main Engine Power (kW)</Label>
                <Input
                  id="mainEnginePower"
                  type="number"
                  step="0.01"
                  {...form.register("mainEnginePower", { valueAsNumber: true })}
                  placeholder="e.g., 12500"
                  data-testid="input-main-engine-power"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainEngineSFC">Main Engine SFC (g/kWh)</Label>
                <Input
                  id="mainEngineSFC"
                  type="number"
                  step="0.01"
                  {...form.register("mainEngineSFC", { valueAsNumber: true })}
                  placeholder="Default: 190"
                  data-testid="input-main-sfc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auxiliaryPower">Auxiliary Power (kW)</Label>
                <Input
                  id="auxiliaryPower"
                  type="number"
                  step="0.01"
                  {...form.register("auxiliaryPower", { valueAsNumber: true })}
                  placeholder="e.g., 850"
                  data-testid="input-aux-power"
                />
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceSpeed">Reference Speed (knots)</Label>
                <Input
                  id="referenceSpeed"
                  type="number"
                  step="0.01"
                  {...form.register("referenceSpeed", { valueAsNumber: true })}
                  placeholder="e.g., 14.5"
                  data-testid="input-reference-speed"
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
                  data-testid="input-capacity"
                />
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

            <Button type="submit" className="w-full" data-testid="button-calculate-eedi">
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
