import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingDown, Fuel, Ship, Lightbulb, Loader2 } from "lucide-react";

interface OptimizationRecommendation {
  type: string;
  title: string;
  description: string;
  from?: number;
  to?: number;
  unit?: string;
  impact: 'high' | 'medium' | 'low';
  suggestions?: string[];
  alternatives?: Array<{
    fuel: string;
    cii: number;
    rating: string;
    improvement: number;
  }>;
}

interface OptimizationResult {
  success: boolean;
  currentRating: string;
  targetRating: string;
  achievedRating: string;
  currentCII: number;
  targetCII: number;
  optimizedCII: number;
  requiredCII: number;
  improvement: number;
  recommendations: OptimizationRecommendation[];
  optimizedParams: {
    annualFuelConsumption: number;
    distanceTraveled: number;
    fuelType: string;
  };
}

interface CIIOptimizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentParams: {
    annualFuelConsumption: number;
    distanceTraveled: number;
    capacity: number;
    fuelType: string;
    year: number;
  };
  shipType: string;
  currentRating: string;
}

export function CIIOptimizationDialog({
  open,
  onOpenChange,
  currentParams,
  shipType,
  currentRating,
}: CIIOptimizationDialogProps) {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runOptimization = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5001/api/optimize/cii', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentParams: {
            annualFuelConsumption: currentParams.annualFuelConsumption,
            distanceTraveled: currentParams.distanceTraveled,
            fuelType: currentParams.fuelType,
          },
          shipInfo: {
            shipType: shipType,
            capacity: currentParams.capacity,
            year: currentParams.year,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Optimization service unavailable');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Optimization failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run optimization');
    } finally {
      setLoading(false);
    }
  };

  // Run optimization when dialog opens
  useState(() => {
    if (open && !result && !loading) {
      runOptimization();
    }
  });

  const getRatingColor = (rating: string) => {
    const colors = {
      A: "text-green-600 bg-green-50 border-green-200",
      B: "text-blue-600 bg-blue-50 border-blue-200",
      C: "text-amber-600 bg-amber-50 border-amber-200",
      D: "text-orange-600 bg-orange-50 border-orange-200",
      E: "text-red-600 bg-red-50 border-red-200",
    };
    return colors[rating as keyof typeof colors] || colors.C;
  };

  const getImpactColor = (impact: string) => {
    const colors = {
      high: "bg-red-100 text-red-700 border-red-300",
      medium: "bg-amber-100 text-amber-700 border-amber-300",
      low: "bg-blue-100 text-blue-700 border-blue-300",
    };
    return colors[impact as keyof typeof colors] || colors.medium;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            CII Rating Optimization
          </DialogTitle>
          <DialogDescription>
            AI-powered recommendations to improve your vessel's CII rating
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Running optimization analysis...</p>
            </div>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
              <Button onClick={runOptimization} className="mt-4" variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {result && !loading && (
          <div className="space-y-6">
            {/* Rating Comparison */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Current Rating</p>
                    <Badge className={`text-2xl font-bold px-4 py-2 ${getRatingColor(result.currentRating)}`}>
                      {result.currentRating}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">CII: {result.currentCII}</p>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-8 w-8 text-muted-foreground" />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Target Rating</p>
                    <Badge className={`text-2xl font-bold px-4 py-2 ${getRatingColor(result.achievedRating)}`}>
                      {result.achievedRating}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">CII: {result.optimizedCII}</p>
                  </div>
                </div>

                {result.improvement > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-700 font-semibold">
                      {result.improvement}% improvement possible
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Optimization Recommendations
              </h3>

              {result.recommendations.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      Your vessel is already operating at optimal efficiency for the current rating.
                    </p>
                  </CardContent>
                </Card>
              )}

              {result.recommendations.map((rec, idx) => (
                <Card key={idx} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {rec.type.includes('fuel') && <Fuel className="h-5 w-5 text-primary" />}
                        {rec.type.includes('distance') && <Ship className="h-5 w-5 text-primary" />}
                        <div>
                          <h4 className="font-semibold">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                        </div>
                      </div>
                      <Badge className={getImpactColor(rec.impact)}>
                        {rec.impact} impact
                      </Badge>
                    </div>

                    {rec.from !== undefined && rec.to !== undefined && (
                      <div className="flex items-center gap-3 my-3 p-3 bg-muted rounded-lg">
                        <div className="text-center flex-1">
                          <p className="text-xs text-muted-foreground">Current</p>
                          <p className="font-mono font-semibold">{rec.from.toLocaleString()} {rec.unit}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="text-center flex-1">
                          <p className="text-xs text-muted-foreground">Optimized</p>
                          <p className="font-mono font-semibold text-primary">{rec.to.toLocaleString()} {rec.unit}</p>
                        </div>
                      </div>
                    )}

                    {rec.alternatives && rec.alternatives.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">Alternative Fuels:</p>
                        {rec.alternatives.map((alt, altIdx) => (
                          <div key={altIdx} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="font-medium">{alt.fuel}</span>
                            <div className="flex items-center gap-3">
                              <Badge className={getRatingColor(alt.rating)}>{alt.rating}</Badge>
                              <span className="text-sm text-green-600">+{alt.improvement}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {rec.suggestions && rec.suggestions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">How to achieve this:</p>
                        <ul className="space-y-1">
                          {rec.suggestions.map((suggestion, suggIdx) => (
                            <li key={suggIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
