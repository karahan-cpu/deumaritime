import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LockableInput } from "@/components/ui/lockable-input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fuelTypes } from "@shared/schema";
import { calculateCII, getCIIRating, calculateRequiredCII } from "@/lib/calculations";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CIIChart } from "./CIIChart";
import { CIIForecastTable } from "./CIIForecastTable";


export function CIICalculator() {
  const [result, setResult] = useState<{ ciScore: number; rating: string; required: number } | null>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [lockedFields, setLockedFields] = useState<Record<string, boolean>>({});
  const [recommendation, setRecommendation] = useState<{ message: string, value?: number } | null>(null);

  const form = useForm({
    defaultValues: {
      fuelConsumption: "",
      distance: "",
      capacity: "",
      fuelType: "",
      shipType: "Bulk Carrier", // Default
      year: "2024",
    },
  });

  function onSubmit(data: any) {
    try {
      const consumption = parseFloat(data.fuelConsumption);
      const dist = parseFloat(data.distance);
      const cap = parseFloat(data.capacity);
      const year = parseInt(data.year);

      const cii = calculateCII(consumption, dist, cap, data.fuelType);
      const required = calculateRequiredCII(data.shipType, cap, year);
      const rating = getCIIRating(cii, required);

      setResult({ ciScore: cii, rating, required });
      setResult({ ciScore: cii, rating, required });
      setRecommendation(null);

      // Generate Forecast Data (2019-2030)
      const forecast = [];
      for (let y = 2019; y <= 2030; y++) {
        const req = calculateRequiredCII(data.shipType, cap, y);

        // Logic for "Attained":
        // For the *calculated* year, use the calculated CII.
        // For other years, we could show nothing, or show the same performance (assuming constant efficiency).
        // Let's assume constant performance (same fuel/dist) for illustrative purposes, or only show on current year.
        // Reference image shows Attained only on 2024.
        // Let's show it only for the input year.

        const isCurrentYear = y === year;
        const att = isCurrentYear ? cii : undefined;
        const attRating = isCurrentYear ? rating : undefined;

        forecast.push({
          year: y,
          required: req,
          attained: att,
          attainedRating: attRating,
          // Adjusted logic could go here if we implemented corrections
          limitA: req * 0.88, // Upper limit of A (lower value is better, so A is anything below this)
          limitB: req * 0.94,
          limitC: req * 1.06,
          limitD: req * 1.18,
        });
      }
      setForecastData(forecast);

    } catch (error) {
      console.error(error);
    }
  }

  const handleOptimize = () => {
    if (!result) return;
    const data = form.getValues();
    const capacity = parseFloat(data.capacity);
    const distance = parseFloat(data.distance);
    const year = parseInt(data.year);
    const required = calculateRequiredCII(data.shipType, capacity, year);

    // Target: Rating C upper limit (Required * 1.06) is the bare minimum, but let's aim for A (Required * 0.88)
    // Actually, usually optimizing means "Get me to Compliance (C)".
    // Let's target the midpoint of C rating to be safe, or just below C boundary.
    // Boundary C/D is 1.18 * Required (Wait, >1.06 is D).
    // A: <0.88, B: <0.94, C: <1.06.
    // So target = Required * 1.06 (max compliance).
    // Let's aim safely for Required * 1.0 (Rating C center).

    const targetCII = required * 1.0;

    const isFuelLocked = lockedFields["fuelConsumption"];
    const isDistanceLocked = lockedFields["distance"];

    if (isFuelLocked && isDistanceLocked) {
      // Cannot optimise
      alert("Cannot optimize: Both Fuel Consumption and Distance are locked. Unlock one to proceed."); // Simple alert or toast
      return;
    }

    // Formula: CII = (Fuel * Cf * 10^6) / (Cap * Dist)
    // => Fuel = (CII * Cap * Dist) / (Cf * 10^6)
    // => Dist = (Fuel * Cf * 10^6) / (CII * Cap)

    // Helper to get Cf
    // We need to import getCO2Factor or look it up. It is imported.
    // Wait, getCO2Factor is not imported in original snippet, I need to check imports.
    // It says "import { calculateCII ... } from '@/lib/calculations'".
    // I need to import getCO2Factor. It is exported from calculations.ts.
    // Assuming I can't easily change imports in multi-replace block without check, I'll rely on it or just use the helper if available?
    // Actually getCO2Factor is used in calculateCII inside calculations.ts but might not be exported?
    // Step 32 showed 'export function getCO2Factor'. So I can import it.

    // Let's just assume we can get it via helper or calculating.
    // Or I'll just use the derived emissions from current Result if possible.
    // result.ciScore = (Fuel * Cf * 10^6) / (Cap * Dist).
    // So Fuel * Cf = (result.ciScore * Cap * Dist) / 10^6.
    // Emissions = result.ciScore * Cap * Dist / 10^6.

    // We want target Emisisons = TargetCII * Cap * Dist / 10^6.
    // If optimizing Fuel: New Fuel = New Emissions / Cf.
    // New Fuel = Old Fuel * (TargetCII / OldCII).

    // If optimizing Distance:
    // TargetCII = Emissions / (Cap * NewDist).
    // NewDist = Emissions / (Cap * TargetCII).
    // NewDist = OldDist * (OldCII / TargetCII).

    let optimizationMessage = "";

    if (!isFuelLocked) {
      // Optimize Fuel
      const currentFuel = parseFloat(data.fuelConsumption);
      const newFuel = currentFuel * (targetCII / result.ciScore);

      form.setValue("fuelConsumption", newFuel.toFixed(1));
      optimizationMessage = `Reduced Annual Fuel Consumption to ${newFuel.toFixed(1)} MT to achieve Rating C.`;
    } else if (!isDistanceLocked) {
      // Optimize Distance
      const currentDist = parseFloat(data.distance);
      // To IMPROVE CII (lower it), we need MORE distance for same fuel (efficiency) OR LESS fuel.
      // Formula: CII = Em / (Cap * Dist).
      // Lower CII -> Higher Dist.
      // So asking to "increase distance" to be more efficient?
      // Technially yes, moving cargo further with same fuel is more efficient per mile.
      // But usually optimization implies reducing speed/consumption.
      // If Fuel is locked (e.g. fixed allocation), and we want better rating?
      // We must increase distance? That seems counter-intuitive for a retrofit.
      // "Optimize" usually means "Reduce Emissions".
      // If Fuel is locked, we can't reduce emissions.
      // If Lock means "Fixed value", then we are stuck.

      // EXCEPT: If we change Fuel TYPE. But Fuel Type input doesn't have a lock UI here (select).
      // Let's just stick to Fuel Consumption optimization as primary.
      // If Fuel is locked, warn user.

      setRecommendation({
        message: "Fuel Consumption is locked. Unlocking it allows calculating the required consumption limit for compliance."
      });
      return;
    }

    setRecommendation({
      message: optimizationMessage
    });

    // Auto re-submit?
    // onSubmit(form.getValues()); // Use updated values
    // Better to let user see change and click calculate or trigger it manually?
    // Let's trigger it.
    onSubmit({ ...data, fuelConsumption: form.getValues().fuelConsumption }); // approximate re-submit
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>CII Calculator</CardTitle>
          <CardDescription>
            Calculate Carbon Intensity Indicator (CII) and rating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shipType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ship Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ship type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bulk Carrier">Bulk Carrier</SelectItem>
                          <SelectItem value="Oil Tanker">Oil Tanker</SelectItem>
                          <SelectItem value="Container Ship">Container Ship</SelectItem>
                          <SelectItem value="General Cargo">General Cargo</SelectItem>
                          <SelectItem value="LNG Carrier">LNG Carrier</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <LockableInput
                          type="number"
                          {...field}
                          value={field.value}
                          isLocked={lockedFields["year"]}
                          onLockChange={(locked) => setLockedFields(prev => ({ ...prev, year: locked }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (DWT)</FormLabel>
                      <FormControl>
                        <LockableInput
                          type="number"
                          placeholder="e.g. 50000"
                          {...field}
                          value={field.value}
                          isLocked={lockedFields["capacity"]}
                          onLockChange={(locked) => setLockedFields(prev => ({ ...prev, capacity: locked }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance Traveled (nm)</FormLabel>
                      <FormControl>
                        <LockableInput
                          type="number"
                          placeholder="e.g. 50000"
                          {...field}
                          value={field.value}
                          isLocked={lockedFields["distance"]}
                          onLockChange={(locked) => setLockedFields(prev => ({ ...prev, distance: locked }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuelConsumption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Fuel Consumption (MT)</FormLabel>
                      <FormControl>
                        <LockableInput
                          type="number"
                          placeholder="e.g. 1500"
                          {...field}
                          value={field.value}
                          isLocked={lockedFields["fuelConsumption"]}
                          onLockChange={(locked) => setLockedFields(prev => ({ ...prev, fuelConsumption: locked }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              </div>

              <div className="flex gap-4">
                <Button type="submit" size="lg" className="flex-1">
                  Calculate CII
                </Button>
                {result && result.rating !== 'A' && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    onClick={handleOptimize}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Optimize Unlocked Inputs
                  </Button>
                )}
              </div>
            </form>
          </Form>

          {result && (
            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="text-sm font-medium text-muted-foreground">Attained CII</div>
                  <div className="text-2xl font-bold mt-1">{result.ciScore.toFixed(3)}</div>
                  <div className="text-xs text-muted-foreground mt-1">gCO₂/t·nm</div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="text-sm font-medium text-muted-foreground">Required CII</div>
                  <div className="text-2xl font-bold mt-1">{result.required.toFixed(3)}</div>
                  <div className="text-xs text-muted-foreground mt-1">gCO₂/t·nm</div>
                </div>

                <div className={`p-4 border rounded-lg flex items-center justify-between ${result.rating === 'E' ? 'bg-red-50 border-red-200' :
                  result.rating === 'D' ? 'bg-orange-50 border-orange-200' :
                    result.rating === 'C' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-green-50 border-green-200'
                  }`}>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">CII Rating</div>
                    <div className={`text-4xl font-black mt-1 ${result.rating === 'E' ? 'text-red-600' :
                      result.rating === 'D' ? 'text-orange-600' :
                        result.rating === 'C' ? 'text-yellow-600' :
                          'text-green-600'
                      }`}>{result.rating}</div>
                  </div>
                  {['A', 'B', 'C'].includes(result.rating) ? (
                    <CheckCircle2 className="h-10 w-10 text-green-600 opacity-50" />
                  ) : (
                    <AlertCircle className="h-10 w-10 text-red-600 opacity-50" />
                  )}
                </div>
              </div>

              {recommendation && (
                <div className="space-y-4 pt-6 border-t">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Optimization Result
                    </h4>
                    <p className="text-green-800 mt-2">{recommendation.message}</p>
                  </div>
                </div>
              )}

              {result.rating === 'E' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Critical Rating (E)</AlertTitle>
                  <AlertDescription>
                    Requires immediate corrective action plan (SEEMP Part III).
                  </AlertDescription>
                </Alert>
              )}
              {result.rating === 'D' && (
                <Alert className="border-orange-200 bg-orange-50 text-orange-900">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertTitle>Warning Rating (D)</AlertTitle>
                  <AlertDescription>
                    Three consecutive D ratings require a corrective action plan.
                  </AlertDescription>
                </Alert>
              )}

              {/* Forecast Components */}
              {forecastData.length > 0 && (
                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold">CII Performance Forecast (2019-2030)</h3>

                  {/* Chart */}
                  <div className="grid grid-cols-1 gap-6">
                    <CIIChart data={forecastData} />
                  </div>

                  {/* Table */}
                  <div className="grid grid-cols-1 gap-6">
                    <CIIForecastTable data={forecastData} />
                  </div>
                </div>
              )}

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
