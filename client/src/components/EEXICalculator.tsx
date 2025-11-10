import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eexiInputSchema, fuelTypes, type EEXIInput } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FileText } from "lucide-react";
import { useState } from "react";
import { calculateEEXI, calculateRequiredEEXI } from "@/lib/calculations";
import { ComplianceBadge } from "./ComplianceBadge";

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
      mainEnginePower: 0,
      mainEngineSFC: 190,
      auxiliaryPower: 0,
      auxiliarySFC: 215,
      speed: 0,
      capacity: 0,
      fuelType: "HFO",
      hasEPL: false,
      engineInfo: { engineType: 'two_stroke', count: 1 },
    },
  });

  const handleCalculate = (data: EEXIInput) => {
    const attained = calculateEEXI(
      data.mainEnginePower,
      data.mainEngineSFC,
      data.auxiliaryPower,
      data.auxiliarySFC,
      data.speed,
      data.capacity,
      data.fuelType,
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
                <Label htmlFor="mainEnginePower">Main Engine Power (kW)</Label>
                <Input id="mainEnginePower" type="number" step="0.01" {...form.register("mainEnginePower", { valueAsNumber: true })} placeholder="e.g., 12500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mainEngineSFC">Main Engine SFC (g/kWh)</Label>
                <Input id="mainEngineSFC" type="number" step="0.01" {...form.register("mainEngineSFC", { valueAsNumber: true })} placeholder="Default: 190" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auxiliaryPower">Auxiliary Power (kW)</Label>
                <Input id="auxiliaryPower" type="number" step="0.01" {...form.register("auxiliaryPower", { valueAsNumber: true })} placeholder="e.g., 850" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auxiliarySFC">Auxiliary SFC (g/kWh)</Label>
                <Input id="auxiliarySFC" type="number" step="0.01" {...form.register("auxiliarySFC", { valueAsNumber: true })} placeholder="Default: 215" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speed">Reference Speed (knots)</Label>
                <Input id="speed" type="number" step="0.01" {...form.register("speed", { valueAsNumber: true })} placeholder="e.g., 14.5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (DWT)</Label>
                <Input id="capacity" type="number" step="0.01" {...form.register("capacity", { valueAsNumber: true })} placeholder="e.g., 85000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select value={form.watch("fuelType")} onValueChange={(value) => form.setValue("fuelType", value)}>
                  <SelectTrigger>
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

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="hasEPL">EPL (Engine Power Limitation)</Label>
                <p className="text-xs text-muted-foreground">Apply 83% derating when enabled</p>
              </div>
              <Switch id="hasEPL" checked={form.watch("hasEPL")} onCheckedChange={(v) => form.setValue("hasEPL", v)} />
            </div>

            <Button type="submit" className="w-full" data-testid="button-calculate-eexi">Calculate EEXI</Button>
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
