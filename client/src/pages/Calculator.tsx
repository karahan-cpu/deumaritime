import { useState } from "react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShipInfoForm } from "@/components/ShipInfoForm";
import { EEDICalculator } from "@/components/EEDICalculator";
import { CIICalculator } from "@/components/CIICalculator";
import { FuelEUCalculator } from "@/components/FuelEUCalculator";
import { EUETSCalculator } from "@/components/EUETSCalculator";
import { IMOGFICalculator } from "@/components/IMOGFICalculator";
import { ShipbuildingCostCalculator } from "@/components/ShipbuildingCostCalculator";
import { FuelCostCalculator } from "@/components/FuelCostCalculator";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import { CostSummaryCard } from "@/components/CostSummaryCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Anchor, FileText, TrendingDown, Euro, DollarSign, BarChart3, Ship, Fuel, Globe, Target } from "lucide-react";
import { CIIRatingDisplay } from "@/components/CIIRatingDisplay";
import { ComplianceBadge } from "@/components/ComplianceBadge";
import { GHGIntensityChart } from "@/components/GHGIntensityChart";
import type { ShipInfo } from "@shared/schema";
import { calculateIMOGFI, calculateFuelCost, calculateCII, calculateRequiredCII, getCIIRating, type OptimizationParameters } from "@/lib/calculations";

interface EEDIResult {
  attained: number;
  required: number;
  compliant: boolean;
}

interface CIIResult {
  attained: number;
  required: number;
  rating: "A" | "B" | "C" | "D" | "E";
}

interface FuelEUResult {
  intensity: number;
  limit: number;
  penalty: number;
  compliance: boolean;
}

interface EUETSResult {
  allowancesNeeded: number;
  cost: number;
  coverage: number;
}

type IMOGFIResult = ReturnType<typeof calculateIMOGFI>;
type FuelCostResult = ReturnType<typeof calculateFuelCost>;

export default function Calculator() {
  const [shipInfo, setShipInfo] = useState<ShipInfo | null>(null);
  const [activeTab, setActiveTab] = useState("ship-info");
  const [eediResult, setEediResult] = useState<EEDIResult | null>(null);
  const [ciiResult, setCiiResult] = useState<CIIResult | null>(null);
  const [fuelEUResult, setFuelEUResult] = useState<FuelEUResult | null>(null);
  const [euETSResult, setEuETSResult] = useState<EUETSResult | null>(null);
  const [imoGFIResult, setImoGFIResult] = useState<IMOGFIResult | null>(null);
  const [shipbuildingCost, setShipbuildingCost] = useState<number>(0);
  const [fuelCostResult, setFuelCostResult] = useState<FuelCostResult | null>(null);
  const [optimizationParams, setOptimizationParams] = useState<OptimizationParameters>({
    annualFuelConsumption: 5000,
    distanceTraveled: 70000,
    mainEnginePower: 10000,
    auxiliaryPower: 500,
    daysAtSea: 300,
    daysInPort: 50,
    fuelType: "HFO",
    fuelPrice: 550,
  });

  const handleShipInfoSubmit = (data: ShipInfo) => {
    setShipInfo(data);
    setActiveTab(data.isNewBuild ? "eedi" : "cii");
  };

  const handleApplyOptimization = (params: OptimizationParameters) => {
    setOptimizationParams(params);
    
    if (shipInfo) {
      const attainedCII = calculateCII(
        params.annualFuelConsumption,
        params.distanceTraveled,
        shipInfo.deadweight,
        params.fuelType
      );
      const requiredCII = calculateRequiredCII(shipInfo.shipType, shipInfo.deadweight, new Date().getFullYear());
      const rating = getCIIRating(attainedCII, requiredCII) as "A" | "B" | "C" | "D" | "E";
      
      setCiiResult({ attained: attainedCII, required: requiredCII, rating });
      
      const fuelCostResult = calculateFuelCost(
        params.mainEnginePower,
        params.auxiliaryPower,
        params.daysAtSea,
        params.daysInPort,
        params.fuelType,
        params.fuelPrice
      );
      setFuelCostResult(fuelCostResult);
    }
    
    setActiveTab("summary");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Anchor className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Maritime Emissions Calculator</h1>
                <p className="text-sm text-muted-foreground">EEDI · EEXI · CII · FuelEU · EU ETS · GFI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/fleet">
                <Button variant="outline" data-testid="button-fleet-nav">
                  <Ship className="h-4 w-4" />
                  Fleet
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-11 gap-2">
            <TabsTrigger value="ship-info" className="gap-2" data-testid="tab-ship-info">
              <Anchor className="h-4 w-4" />
              <span className="hidden sm:inline">Ship Info</span>
            </TabsTrigger>
            {shipInfo?.isNewBuild && (
              <TabsTrigger value="eedi" className="gap-2" data-testid="tab-eedi">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">EEDI</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="cii" className="gap-2" disabled={!shipInfo} data-testid="tab-cii">
              <TrendingDown className="h-4 w-4" />
              <span className="hidden sm:inline">CII</span>
            </TabsTrigger>
            <TabsTrigger value="fueleu" className="gap-2" disabled={!shipInfo} data-testid="tab-fueleu">
              <Euro className="h-4 w-4" />
              <span className="hidden sm:inline">FuelEU</span>
            </TabsTrigger>
            <TabsTrigger value="euets" className="gap-2" disabled={!shipInfo} data-testid="tab-euets">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">EU ETS</span>
            </TabsTrigger>
            <TabsTrigger value="imogfi" className="gap-2" disabled={!shipInfo} data-testid="tab-imogfi">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">IMO GFI</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="gap-2" disabled={!shipInfo} data-testid="tab-costs">
              <Ship className="h-4 w-4" />
              <span className="hidden sm:inline">Costs</span>
            </TabsTrigger>
            <TabsTrigger value="optimize" className="gap-2" disabled={!shipInfo} data-testid="tab-optimize">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Optimize</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2" disabled={!shipInfo} data-testid="tab-summary">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ship-info" className="space-y-6">
            <ShipInfoForm onSubmit={handleShipInfoSubmit} defaultValues={shipInfo || undefined} />
            
            {!shipInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to the Maritime Emissions Calculator</CardTitle>
                  <CardDescription>
                    Calculate compliance with all major maritime emission regulations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">EEDI / EEXI</h3>
                      <p className="text-sm text-muted-foreground">
                        Energy efficiency design index for new builds and existing ships
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">CII Rating</h3>
                      <p className="text-sm text-muted-foreground">
                        Annual carbon intensity indicator with A-E rating system
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">FuelEU Maritime</h3>
                      <p className="text-sm text-muted-foreground">
                        GHG intensity limits and penalty calculations for EU operations
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">EU ETS</h3>
                      <p className="text-sm text-muted-foreground">
                        Emissions trading system allowance costs for EU ports
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {shipInfo?.isNewBuild && (
            <TabsContent value="eedi">
              <EEDICalculator
                shipType={shipInfo.shipType}
                isNewBuild={shipInfo.isNewBuild}
                yearBuilt={shipInfo.yearBuilt}
                onResultCalculated={setEediResult}
              />
            </TabsContent>
          )}

          <TabsContent value="cii">
            {shipInfo && <CIICalculator shipType={shipInfo.shipType} onResultCalculated={setCiiResult} />}
          </TabsContent>

          <TabsContent value="fueleu">
            <FuelEUCalculator onResultCalculated={setFuelEUResult} />
          </TabsContent>

          <TabsContent value="euets">
            <EUETSCalculator onResultCalculated={setEuETSResult} />
          </TabsContent>

          <TabsContent value="imogfi">
            <IMOGFICalculator onCalculate={setImoGFIResult} />
          </TabsContent>

          <TabsContent value="costs">
            <div className="grid gap-6">
              {shipInfo && (
                <ShipbuildingCostCalculator onCalculate={setShipbuildingCost} />
              )}
              <FuelCostCalculator onCalculate={setFuelCostResult} />
            </div>
          </TabsContent>

          <TabsContent value="optimize">
            {shipInfo && (
              <OptimizationPanel
                shipType={shipInfo.shipType}
                shipCapacity={shipInfo.deadweight}
                year={new Date().getFullYear()}
                currentParameters={optimizationParams}
                onApply={handleApplyOptimization}
              />
            )}
          </TabsContent>

          <TabsContent value="summary">
            <div className="space-y-6">
              <GHGIntensityChart attainedIntensity={fuelEUResult?.intensity} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Summary</CardTitle>
                  <CardDescription>
                    Overview of all regulatory calculations for {shipInfo?.shipName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Ship Info Summary */}
                    {shipInfo && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
                        <div>
                          <div className="text-sm text-muted-foreground">Ship Type</div>
                          <div className="font-semibold">{shipInfo.shipType}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Deadweight</div>
                          <div className="font-semibold font-mono">{shipInfo.deadweight.toLocaleString()} DWT</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Gross Tonnage</div>
                          <div className="font-semibold font-mono">{shipInfo.grossTonnage.toLocaleString()} GT</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Year Built</div>
                          <div className="font-semibold font-mono">{shipInfo.yearBuilt}</div>
                        </div>
                      </div>
                    )}

                    {/* EEDI Results */}
                    {eediResult && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">EEDI (Energy Efficiency Design Index)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Attained EEDI</div>
                            <div className="text-xl font-bold font-mono">{eediResult.attained.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">gCO₂/tonne-nm</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Required EEDI</div>
                            <div className="text-xl font-bold font-mono">{eediResult.required.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">gCO₂/tonne-nm</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="mt-1">
                              <ComplianceBadge status={eediResult.compliant ? "compliant" : "non-compliant"} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CII Results */}
                    {ciiResult && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">CII (Carbon Intensity Indicator)</h3>
                        <CIIRatingDisplay
                          rating={ciiResult.rating}
                          attainedCII={ciiResult.attained}
                          requiredCII={ciiResult.required}
                        />
                      </div>
                    )}

                    {/* FuelEU Results */}
                    {fuelEUResult && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">FuelEU Maritime</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">GHG Intensity</div>
                            <div className="text-xl font-bold font-mono">{fuelEUResult.intensity.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">gCO₂eq/MJ</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Required Limit</div>
                            <div className="text-xl font-bold font-mono">{fuelEUResult.limit.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">gCO₂eq/MJ</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Penalty</div>
                            <div className="text-xl font-bold font-mono text-destructive">
                              €{fuelEUResult.penalty.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="mt-1">
                              <ComplianceBadge status={fuelEUResult.compliance ? "compliant" : "non-compliant"} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EU ETS Results */}
                    {euETSResult && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">EU ETS (Emissions Trading System)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Allowances Needed</div>
                            <div className="text-xl font-bold font-mono">
                              {euETSResult.allowancesNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div className="text-xs text-muted-foreground">tonnes CO₂</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Annual Cost</div>
                            <div className="text-xl font-bold font-mono text-destructive">
                              €{euETSResult.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Coverage</div>
                            <div className="text-xl font-bold font-mono">{(euETSResult.coverage * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!eediResult && !ciiResult && !fuelEUResult && !euETSResult && (
                      <div className="text-center py-12 text-muted-foreground">
                        Complete calculations in each tab to see the summary
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {(euETSResult || fuelEUResult || ciiResult || imoGFIResult || shipbuildingCost || fuelCostResult) && (
                <CostSummaryCard
                  shipName={shipInfo?.shipName}
                  complianceYear={2025}
                  totalFuelEnergy={fuelCostResult ? fuelCostResult.totalConsumption * 41000 : 0}
                  costs={{
                    shipbuildingCosts: shipbuildingCost,
                    fuelCosts: fuelCostResult ? fuelCostResult.totalCost : 0,
                    imoGFITier1Costs: imoGFIResult ? imoGFIResult.tier1Cost : 0,
                    imoGFITier2Costs: imoGFIResult ? imoGFIResult.tier2Cost : 0,
                    imoGFIRewardCosts: imoGFIResult ? imoGFIResult.rewardCost : 0,
                    ciiCosts: 0,
                    fuelEUMaritimeCosts: fuelEUResult ? fuelEUResult.penalty : 0,
                    otherCosts: euETSResult ? euETSResult.cost : 0,
                  }}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
