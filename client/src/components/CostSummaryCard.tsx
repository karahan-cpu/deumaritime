import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, TrendingUp } from "lucide-react";

interface CostBreakdown {
  shipbuildingCosts: number;
  fuelCosts: number;
  imoGFITier1Costs: number;
  imoGFITier2Costs: number;
  imoGFIRewardCosts: number;
  ciiCosts: number;
  fuelEUMaritimeCosts: number;
  otherCosts: number;
}

interface CostSummaryCardProps {
  costs: CostBreakdown;
  shipName?: string;
  complianceYear?: number;
  totalFuelEnergy?: number;
}

export function CostSummaryCard({ 
  costs, 
  shipName,
  complianceYear = 2025,
  totalFuelEnergy = 0
}: CostSummaryCardProps) {
  const totalCosts = 
    costs.shipbuildingCosts +
    costs.fuelCosts +
    costs.imoGFITier1Costs +
    costs.imoGFITier2Costs +
    costs.imoGFIRewardCosts +
    costs.ciiCosts +
    costs.fuelEUMaritimeCosts +
    costs.otherCosts;

  const regulatoryCosts = 
    costs.imoGFITier1Costs +
    costs.imoGFITier2Costs +
    costs.imoGFIRewardCosts +
    costs.ciiCosts +
    costs.fuelEUMaritimeCosts;

  const totalCostsPerHFOeq = totalFuelEnergy > 0 ? totalCosts / totalFuelEnergy : 0;
  const regulatoryCostsPerHFOeq = totalFuelEnergy > 0 ? regulatoryCosts / totalFuelEnergy : 0;

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null || value === 0) return '0';
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const formatPerUnit = (value: number | undefined) => {
    if (value === undefined || value === null || value === 0) return '0';
    return value.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  return (
    <Card data-testid="card-cost-summary">
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Cost Summary</CardTitle>
              <CardDescription>
                Annual cost breakdown - {complianceYear}
              </CardDescription>
            </div>
          </div>
          {shipName && (
            <Badge variant="outline" className="text-xs" data-testid="badge-ship-name">
              {shipName}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-primary/20">
                <th className="text-left py-3 px-3 font-semibold text-foreground bg-primary/5">
                  Year
                </th>
                <th className="text-right py-3 px-3 font-semibold text-foreground bg-primary/5">
                  {complianceYear}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover-elevate" data-testid="cost-row-shipbuilding">
                <td className="py-2.5 px-3 font-medium">
                  Shipbuilding costs
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatCurrency(costs.shipbuildingCosts)}
                </td>
              </tr>

              <tr className="border-b hover-elevate" data-testid="cost-row-fuel">
                <td className="py-2.5 px-3 font-medium">
                  Fuel costs
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatCurrency(costs.fuelCosts)}
                </td>
              </tr>

              <tr className={`border-b hover-elevate ${costs.imoGFITier1Costs > 0 ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`} data-testid="cost-row-gfi-tier1">
                <td className="py-2.5 px-3 font-medium">
                  IMO GFI (Tier 1) costs
                </td>
                <td className={`py-2.5 px-3 text-right font-mono font-semibold ${costs.imoGFITier1Costs > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                  {costs.imoGFITier1Costs > 0 && '€'}
                  {formatCurrency(costs.imoGFITier1Costs)}
                </td>
              </tr>

              <tr className={`border-b hover-elevate ${costs.imoGFITier2Costs > 0 ? 'bg-destructive/5' : ''}`} data-testid="cost-row-gfi-tier2">
                <td className="py-2.5 px-3 font-medium">
                  IMO GFI (Tier 2) costs
                </td>
                <td className={`py-2.5 px-3 text-right font-mono font-semibold ${costs.imoGFITier2Costs > 0 ? 'text-destructive' : ''}`}>
                  {costs.imoGFITier2Costs > 0 && '€'}
                  {formatCurrency(costs.imoGFITier2Costs)}
                </td>
              </tr>

              <tr className="border-b hover-elevate" data-testid="cost-row-gfi-reward">
                <td className="py-2.5 px-3 font-medium">
                  IMO GFI (Reward) costs
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-green-600 dark:text-green-400 font-semibold">
                  {formatCurrency(costs.imoGFIRewardCosts)}
                </td>
              </tr>

              <tr className="border-b hover-elevate" data-testid="cost-row-cii">
                <td className="py-2.5 px-3 font-medium">
                  CII costs
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatCurrency(costs.ciiCosts)}
                </td>
              </tr>

              <tr className={`border-b hover-elevate ${costs.fuelEUMaritimeCosts > 0 ? 'bg-destructive/5' : ''}`} data-testid="cost-row-fueleu">
                <td className="py-2.5 px-3 font-medium">
                  FuelEU Maritime costs
                </td>
                <td className={`py-2.5 px-3 text-right font-mono font-semibold ${costs.fuelEUMaritimeCosts > 0 ? 'text-destructive' : ''}`}>
                  {costs.fuelEUMaritimeCosts > 0 && '€'}
                  {formatCurrency(costs.fuelEUMaritimeCosts)}
                </td>
              </tr>

              <tr className="border-b hover-elevate" data-testid="cost-row-other">
                <td className="py-2.5 px-3 font-medium">
                  Other costs
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatCurrency(costs.otherCosts)}
                </td>
              </tr>

              <tr className="border-b-2 border-primary/40 bg-primary/5" data-testid="cost-row-total">
                <td className="py-3 px-3 font-bold">
                  Total costs
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-lg text-primary" data-testid="text-total-cost">
                  €{formatCurrency(totalCosts)}
                </td>
              </tr>

              <tr className="border-b hover-elevate" data-testid="cost-row-per-hfoeq">
                <td className="py-2.5 px-3 font-medium">
                  Total costs /(1 HFOeq)
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-sm">
                  {formatPerUnit(totalCostsPerHFOeq)}
                </td>
              </tr>

              <tr className="border-b hover-elevate" data-testid="cost-row-regulatory-per-hfoeq">
                <td className="py-2.5 px-3 font-medium">
                  Regulations costs /(1 HFOeq)
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-sm">
                  {formatPerUnit(regulatoryCostsPerHFOeq)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></div>
              <div>
                <div className="font-semibold text-muted-foreground">IMO GFI Tiers</div>
                <div className="text-muted-foreground">Tier 1: €100/t, Tier 2: €380/t CO₂eq</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0"></div>
              <div>
                <div className="font-semibold text-muted-foreground">FuelEU Maritime</div>
                <div className="text-muted-foreground">GHG intensity compliance penalties</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500 flex-shrink-0"></div>
              <div>
                <div className="font-semibold text-muted-foreground">CII Rating</div>
                <div className="text-muted-foreground">Operational efficiency requirements</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
