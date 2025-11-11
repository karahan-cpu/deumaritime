import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShipInfoForm } from "@/components/ShipInfoForm";
import { EEDICalculator } from "@/components/EEDICalculator";
import { EEXICalculator } from "@/components/EEXICalculator";
import { CIICalculator } from "@/components/CIICalculator";
import { FuelEUCalculator } from "@/components/FuelEUCalculator";
import { EUETSCalculator } from "@/components/EUETSCalculator";
import { IMOGFICalculator } from "@/components/IMOGFICalculator";
import { ShipbuildingCostCalculator } from "@/components/ShipbuildingCostCalculator";
import { FuelCostCalculator } from "@/components/FuelCostCalculator";
import { CostSummaryCard } from "@/components/CostSummaryCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Anchor, FileText, TrendingDown, Euro, DollarSign, BarChart3, Ship, Fuel, Globe, Gauge, Beaker, ClipboardList, ArrowLeftRight } from "lucide-react";
import { CIIRatingDisplay } from "@/components/CIIRatingDisplay";
import { CIIForecastTable } from "@/components/CIIForecastTable";
import { ComplianceBadge } from "@/components/ComplianceBadge";
import { GHGIntensityChart } from "@/components/GHGIntensityChart";
import type { ShipInfo } from "@shared/schema";
import { calculateIMOGFI, calculateFuelCost } from "@/lib/calculations";

interface EEDIResult {
  attained: number;
  required: number;
  compliant: boolean;
}

interface EEXIResult {
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
  const [eexiResult, setEexiResult] = useState<EEXIResult | null>(null);
  const [ciiResult, setCiiResult] = useState<CIIResult | null>(null);
  const [fuelEUResult, setFuelEUResult] = useState<FuelEUResult | null>(null);
  const [euETSResult, setEuETSResult] = useState<EUETSResult | null>(null);
  const [imoGFIResult, setImoGFIResult] = useState<IMOGFIResult | null>(null);
  const [shipbuildingCost, setShipbuildingCost] = useState<number>(0);
  const [fuelCostResult, setFuelCostResult] = useState<FuelCostResult | null>(null);

  const handleShipInfoSubmit = (data: ShipInfo) => {
    setShipInfo(data);
    setActiveTab(data.isNewBuild ? "eedi" : "cii");
  };


  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation - Always Visible */}
      <aside className="w-64 flex-shrink-0 border-r bg-background">
        <div className="sticky top-0 h-screen overflow-y-auto p-4">
          <div className="mb-6 pb-4 border-b">
            <h2 className="text-lg font-semibold">Fleet Simulator</h2>
          </div>
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
              <Gauge className="h-4 w-4" />
              Dashboard
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
              <Beaker className="h-4 w-4" />
              Analyser
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground bg-accent rounded-md">
              <ClipboardList className="h-4 w-4" />
              Estimator
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
              <BarChart3 className="h-4 w-4" />
              Ship Finder
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
              <ArrowLeftRight className="h-4 w-4" />
              Risk manager
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <Anchor className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-xl font-bold truncate">Maritime Emissions Calculator</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">EEDI · EEXI · CII · FuelEU · EU ETS · GFI</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-3 lg:grid-cols-10 gap-1.5 sm:gap-2 h-auto p-1">
            <TabsTrigger value="ship-info" className="gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3" data-testid="tab-ship-info">
              <Anchor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Ship Info</span>
            </TabsTrigger>
            {shipInfo?.isNewBuild && (
              <TabsTrigger value="eedi" className="gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3" data-testid="tab-eedi">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">EEDI</span>
              </TabsTrigger>
            )}
            {!shipInfo?.isNewBuild && (
              <TabsTrigger value="eexi" className="gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3" data-testid="tab-eexi">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">EEXI</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="cii" className="gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3" disabled={!shipInfo} data-testid="tab-cii">
              <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">CII</span>
            </TabsTrigger>
            <TabsTrigger value="fueleu" className="gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3" disabled={!shipInfo} data-testid="tab-fueleu">
              <Euro className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">FuelEU</span>
            </TabsTrigger>
            <TabsTrigger value="euets" className="gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3" disabled={!shipInfo} data-testid="tab-euets">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">EU ETS</span>
            </TabsTrigger>
            <TabsTrigger value="imogfi" className="gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3" disabled={!shipInfo} data-testid="tab-imogfi">
              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">IMO GFI</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3" disabled={!shipInfo} data-testid="tab-costs">
              <Ship className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Costs</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3" disabled={!shipInfo} data-testid="tab-summary">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="ship-info" className="space-y-4 sm:space-y-6">
            <ShipInfoForm onSubmit={handleShipInfoSubmit} defaultValues={shipInfo || undefined} />
            
            {!shipInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to the Maritime Emissions Calculator</CardTitle>
                  <CardDescription>
                    Calculate compliance with all major maritime emission regulations
                  </CardDescription>
                </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

          {!shipInfo?.isNewBuild && (
            <TabsContent value="eexi">
              {shipInfo && (
                <EEXICalculator
                  shipType={shipInfo.shipType}
                  yearBuilt={shipInfo.yearBuilt}
                  onResultCalculated={setEexiResult}
                />
              )}
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

          <TabsContent value="summary">
            <div className="space-y-6">
              <GHGIntensityChart 
                attainedGFI={imoGFIResult?.attainedGFI}
                baseTarget={imoGFIResult?.baseTarget}
                directTarget={imoGFIResult?.directTarget}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Summary</CardTitle>
                  <CardDescription>
                    Overview of all regulatory calculations for {shipInfo?.shipName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 sm:space-y-6">
                    {/* Ship Info Summary */}
                    {shipInfo && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pb-3 sm:pb-4 border-b">
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
                        <h3 className="font-semibold text-base sm:text-lg">EEDI (Energy Efficiency Design Index)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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

                    {/* EEXI Results */}
                    {eexiResult && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-base sm:text-lg">EEXI (Existing Ship Efficiency)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Attained EEXI</div>
                            <div className="text-xl font-bold font-mono">{eexiResult.attained.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">gCO₂/tonne-nm</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Required EEXI</div>
                            <div className="text-xl font-bold font-mono">{eexiResult.required.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">gCO₂/tonne-nm</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="mt-1">
                              <ComplianceBadge status={eexiResult.compliant ? "compliant" : "non-compliant"} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CII Results */}
                    {ciiResult && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">CII (Carbon Intensity Indicator)</h3>
                          <CIIRatingDisplay
                            rating={ciiResult.rating}
                            attainedCII={ciiResult.attained}
                            requiredCII={ciiResult.required}
                          />
                        </div>
                        {shipInfo && (
                          <CIIForecastTable
                            vesselName={shipInfo.shipName}
                            shipType={shipInfo.shipType}
                            capacity={shipInfo.deadweight}
                            attainedCII={ciiResult.attained}
                            startYear={new Date().getFullYear()}
                            endYear={2040}
                            currentYear={new Date().getFullYear()}
                          />
                        )}
                      </div>
                    )}

                    {/* FuelEU Results */}
                    {fuelEUResult && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-base sm:text-lg">FuelEU Maritime</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
                        <h3 className="font-semibold text-base sm:text-lg">EU ETS (Emissions Trading System)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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

                    {!eediResult && !eexiResult && !ciiResult && !fuelEUResult && !euETSResult && (
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

        <footer className="border-t py-4 sm:py-6 mt-6 sm:mt-12">
          <div className="px-3 sm:px-4 text-center text-muted-foreground text-xs sm:text-sm">
            2025 Maritime Calculator by Karahan Karakurt
          </div>
        </footer>
      </div>
    </div>
  );
}
