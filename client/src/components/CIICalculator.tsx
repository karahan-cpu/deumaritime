import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
                        <Input type="number" {...field} />
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
                        <Input type="number" placeholder="e.g. 50000" {...field} />
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
                        <Input type="number" placeholder="e.g. 50000" {...field} />
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
                        <Input type="number" placeholder="e.g. 1500" {...field} />
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

              <Button type="submit" size="lg" className="w-full">
                Calculate CII
              </Button>
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
