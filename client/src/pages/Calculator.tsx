import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShipInfoForm } from "@/components/ShipInfoForm";
import { EEDICalculator } from "@/components/EEDICalculator";
import { CIICalculator } from "@/components/CIICalculator";
import { FuelEUCalculator } from "@/components/FuelEUCalculator";
import { EUETSCalculator } from "@/components/EUETSCalculator";
import { CostSummaryCard } from "@/components/CostSummaryCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Anchor, FileText, TrendingDown, Euro, DollarSign, BarChart3 } from "lucide-react";
import { CIIRatingDisplay } from "@/components/CIIRatingDisplay";
import { ComplianceBadge } from "@/components/ComplianceBadge";
import { GHGIntensityChart } from "@/components/GHGIntensityChart";
import type { ShipInfo } from "@shared/schema";

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

export default function Calculator() {
  const [shipInfo, setShipInfo] = useState<ShipInfo | null>(null);
  const [activeTab, setActiveTab] = useState("ship-info");
  const [eediResult, setEediResult] = useState<EEDIResult | null>(null);
  const [ciiResult, setCiiResult] = useState<CIIResult | null>(null);
  const [fuelEUResult, setFuelEUResult] = useState<FuelEUResult | null>(null);
  const [euETSResult, setEuETSResult] = useState<EUETSResult | null>(null);

  const handleShipInfoSubmit = (data: ShipInfo) => {
    setShipInfo(data);
    setActiveTab(data.isNewBuild ? "eedi" : "cii");
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 gap-2">
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

              {(euETSResult || fuelEUResult || ciiResult) && (
                <CostSummaryCard
                  shipName={shipInfo?.shipName}
                  complianceYear={2025}
                  costs={[
                    ...(ciiResult ? [{ 
                      label: "CII Compliance Costs", 
                      amount: 0,
                      description: `${ciiResult.rating} Rating - ${ciiResult.rating === 'A' || ciiResult.rating === 'B' || ciiResult.rating === 'C' ? 'No penalty' : 'Corrective action required'}`,
                      isHighlight: ciiResult.rating === 'D' || ciiResult.rating === 'E'
                    }] : []),
                    ...(fuelEUResult ? [{ 
                      label: "FuelEU Maritime Penalty", 
                      amount: fuelEUResult.penalty, 
                      description: fuelEUResult.compliance ? "Compliant - no penalty" : `Non-compliant: ${fuelEUResult.intensity.toFixed(2)} gCO₂eq/MJ vs ${fuelEUResult.limit.toFixed(2)} limit`,
                      isHighlight: !fuelEUResult.compliance
                    }] : []),
                    ...(euETSResult ? [{ 
                      label: "EU ETS Allowances", 
                      amount: euETSResult.cost, 
                      description: `${euETSResult.allowancesNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })} tonnes CO₂ at ${(euETSResult.coverage * 100).toFixed(0)}% coverage`,
                      isHighlight: true
                    }] : []),
                  ]}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
