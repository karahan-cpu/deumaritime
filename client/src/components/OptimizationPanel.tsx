import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Sparkles, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import {
  optimizeParameters,
  type OptimizationParameters,
  type OptimizationTarget,
  type OptimizationConstraints,
  type OptimizationResult,
} from "@/lib/calculations";

interface OptimizationPanelProps {
  shipType: string;
  shipCapacity: number;
  year: number;
  currentParameters: OptimizationParameters;
  onApply?: (parameters: OptimizationParameters) => void;
}

export function OptimizationPanel({
  shipType,
  shipCapacity,
  year,
  currentParameters,
  onApply,
}: OptimizationPanelProps) {
  const [target, setTarget] = useState<OptimizationTarget>({ type: 'cii_rating', value: 'A' });
  const [parameters, setParameters] = useState<OptimizationParameters>(currentParameters);
  const [optimizedParameters, setOptimizedParameters] = useState<OptimizationParameters | null>(null);
  const [fixedParams, setFixedParams] = useState<Set<keyof OptimizationParameters>>(new Set());
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const toggleFixed = (param: keyof OptimizationParameters) => {
    const newFixed = new Set(fixedParams);
    if (newFixed.has(param)) {
      newFixed.delete(param);
    } else {
      newFixed.add(param);
    }
    setFixedParams(newFixed);
  };

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const hoursAtSea = parameters.daysAtSea * 24;
      const hoursInPort = parameters.daysInPort * 24;
      
      const totalEnergyUsed = 
        (parameters.mainEnginePower * 0.75 * hoursAtSea + 
         parameters.auxiliaryPower * 0.5 * hoursAtSea +
         parameters.auxiliaryPower * 0.3 * hoursInPort) * 3.6;
      
      const fuelConsumption = 
        (parameters.mainEnginePower * 0.75 * hoursAtSea * (parameters.fuelType === "HFO" ? 175 : 185) +
         parameters.auxiliaryPower * 0.5 * hoursAtSea * 220 +
         parameters.auxiliaryPower * 0.3 * hoursInPort * 220) / 1000000;
      
      const cfFactor = parameters.fuelType === "HFO" ? 3.114 : 
                       parameters.fuelType === "LNG" ? 2.750 :
                       parameters.fuelType === "Methanol" ? 1.375 :
                       parameters.fuelType === "Ammonia" ? 0 : 3.206;
      
      const ghgEmissions = fuelConsumption * cfFactor * 1000000000;
      
      const constraints: OptimizationConstraints = {
        fixedParams,
        shipType,
        shipCapacity,
        year,
        totalEnergyUsed,
        ghgEmissions,
      };
      
      const optimizationResult = optimizeParameters(parameters, target, constraints);
      setOptimizedParameters(optimizationResult.parameters);
      setResult(optimizationResult);
      setIsOptimizing(false);
    }, 100);
  };

  const handleApply = () => {
    if (optimizedParameters && onApply) {
      onApply(optimizedParameters);
      setParameters(optimizedParameters);
      setOptimizedParameters(null);
      setResult(null);
    }
  };

  const parameterConfigs: Array<{
    key: keyof OptimizationParameters;
    label: string;
    min: number;
    max: number;
    step: number;
    unit: string;
    format: (v: number) => string;
  }> = [
    {
      key: 'annualFuelConsumption',
      label: 'Annual Fuel Consumption',
      min: 1000,
      max: 20000,
      step: 50,
      unit: 'MT',
      format: (v) => v.toLocaleString(),
    },
    {
      key: 'distanceTraveled',
      label: 'Distance Traveled',
      min: 20000,
      max: 150000,
      step: 500,
      unit: 'NM',
      format: (v) => v.toLocaleString(),
    },
    {
      key: 'mainEnginePower',
      label: 'Main Engine Power',
      min: 2000,
      max: 20000,
      step: 250,
      unit: 'kW',
      format: (v) => v.toLocaleString(),
    },
    {
      key: 'auxiliaryPower',
      label: 'Auxiliary Power',
      min: 200,
      max: 1500,
      step: 25,
      unit: 'kW',
      format: (v) => v.toLocaleString(),
    },
    {
      key: 'daysAtSea',
      label: 'Days at Sea',
      min: 200,
      max: 350,
      step: 2,
      unit: 'days',
      format: (v) => v.toString(),
    },
    {
      key: 'daysInPort',
      label: 'Days in Port',
      min: 0,
      max: 100,
      step: 2,
      unit: 'days',
      format: (v) => v.toString(),
    },
    {
      key: 'fuelPrice',
      label: 'Fuel Price',
      min: 400,
      max: 800,
      step: 5,
      unit: '$/MT',
      format: (v) => `$${v}`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card data-testid="card-optimization-panel">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Auto-Optimization</CardTitle>
                <CardDescription>
                  Set target values and optimize parameters automatically
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs uppercase">
              AI-Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Optimization Target</Label>
            <Select
              value={`${target.type}:${target.value || 'A'}`}
              onValueChange={(value) => {
                const [type, val] = value.split(':');
                setTarget({ type: type as any, value: val });
              }}
            >
              <SelectTrigger data-testid="select-optimization-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cii_rating:A">Achieve CII Rating A</SelectItem>
                <SelectItem value="cii_rating:B">Achieve CII Rating B</SelectItem>
                <SelectItem value="cii_rating:C">Achieve CII Rating C</SelectItem>
                <SelectItem value="minimize_costs:">Minimize Total Costs</SelectItem>
                <SelectItem value="imo_gfi_surplus:">IMO GFI Surplus</SelectItem>
                <SelectItem value="zero_fueleu:">Zero FuelEU Penalty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Adjustable Parameters</Label>
              <div className="text-sm text-muted-foreground">
                Click lock icon to fix values
              </div>
            </div>
            {parameterConfigs.map((config) => {
              const isFixed = fixedParams.has(config.key);
              const currentValue = parameters[config.key] as number;
              const optimizedValue = optimizedParameters?.[config.key] as number;
              const hasChange = optimizedValue !== undefined && optimizedValue !== currentValue;

              return (
                <div key={config.key} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Button
                        type="button"
                        size="icon"
                        variant={isFixed ? "default" : "ghost"}
                        className="h-8 w-8 shrink-0"
                        onClick={() => toggleFixed(config.key)}
                        data-testid={`button-fix-${config.key}`}
                      >
                        {isFixed ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </Button>
                      <Label className="text-sm truncate">{config.label}</Label>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Current</div>
                        <div className="text-sm font-mono font-semibold" data-testid={`text-current-${config.key}`}>
                          {config.format(currentValue)} {config.unit}
                        </div>
                      </div>
                      {hasChange && (
                        <>
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Optimized</div>
                            <div className="text-sm font-mono font-semibold text-primary" data-testid={`text-optimized-${config.key}`}>
                              {config.format(optimizedValue)} {config.unit}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <Slider
                    value={[hasChange ? optimizedValue : currentValue]}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    disabled={isFixed}
                    onValueChange={([value]) => {
                      setParameters({ ...parameters, [config.key]: value });
                      if (optimizedParameters) {
                        setOptimizedParameters(null);
                        setResult(null);
                      }
                    }}
                    className={hasChange ? "accent-primary" : ""}
                    data-testid={`slider-${config.key}`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="flex-1"
              data-testid="button-optimize"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isOptimizing ? 'Optimizing...' : 'Auto-Optimize'}
            </Button>
            {optimizedParameters && (
              <Button
                onClick={handleApply}
                variant="default"
                className="flex-1"
                data-testid="button-apply"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Apply to Calculators
              </Button>
            )}
          </div>

          {result && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Optimization Complete</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Completed in {result.iterations} iterations
                  </div>
                  {result.improvements.ciiRating && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm">CII Rating:</span>
                      <Badge variant={result.improvements.ciiRating === 'A' ? 'default' : 'secondary'}>
                        {result.improvements.ciiRating}
                      </Badge>
                    </div>
                  )}
                  {result.improvements.totalCosts !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Costs:</span>
                      <span className="text-sm font-mono font-semibold">
                        ${result.improvements.totalCosts.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
