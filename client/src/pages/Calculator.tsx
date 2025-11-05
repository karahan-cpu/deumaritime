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
import type { ShipInfo } from "@shared/schema";

export default function Calculator() {
  const [shipInfo, setShipInfo] = useState<ShipInfo | null>(null);
  const [activeTab, setActiveTab] = useState("ship-info");

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
              />
            </TabsContent>
          )}

          <TabsContent value="cii">
            {shipInfo && <CIICalculator shipType={shipInfo.shipType} />}
          </TabsContent>

          <TabsContent value="fueleu">
            <FuelEUCalculator />
          </TabsContent>

          <TabsContent value="euets">
            <EUETSCalculator />
          </TabsContent>

          <TabsContent value="summary">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Summary</CardTitle>
                  <CardDescription>
                    Overview of all regulatory calculations for {shipInfo?.shipName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    Complete calculations in each tab to see the summary
                  </div>
                </CardContent>
              </Card>

              <CostSummaryCard
                costs={[
                  { label: "EU ETS Allowances", amount: 0, description: "Complete EU ETS calculation" },
                  { label: "FuelEU Maritime Penalty", amount: 0, description: "Complete FuelEU calculation" },
                ]}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
