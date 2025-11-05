import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, TrendingUp } from "lucide-react";

interface CostItem {
  label: string;
  amount: number;
  description?: string;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isHighlight?: boolean;
}

interface CostSummaryCardProps {
  costs: CostItem[];
  totalLabel?: string;
  shipName?: string;
  complianceYear?: number;
}

export function CostSummaryCard({ 
  costs, 
  totalLabel = "Total Annual Compliance Costs",
  shipName,
  complianceYear = 2025
}: CostSummaryCardProps) {
  const total = costs.reduce((sum, item) => sum + item.amount, 0);
  const regulatoryCosts = costs.filter(c => !c.isTotal && !c.isSubtotal).reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card data-testid="card-cost-summary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Annual Cost Summary</CardTitle>
              <CardDescription>
                Regulatory compliance costs breakdown - {complianceYear}
              </CardDescription>
            </div>
          </div>
          {shipName && (
            <Badge variant="outline" className="text-xs">
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
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">
                  Cost Category
                </th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground">
                  {complianceYear}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b bg-muted/30">
                <td className="py-2 px-2 font-semibold text-xs uppercase tracking-wide" colSpan={2}>
                  Regulatory Compliance Costs
                </td>
              </tr>
              
              {costs.filter(c => !c.isTotal && !c.isSubtotal).map((cost, index) => (
                <tr 
                  key={index} 
                  className={`border-b hover-elevate ${cost.isHighlight ? 'bg-destructive/5' : ''}`}
                  data-testid={`cost-row-${index}`}
                >
                  <td className="py-3 px-2">
                    <div className="font-medium">{cost.label}</div>
                    {cost.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">{cost.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className={`font-mono font-semibold ${cost.amount > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
                      {cost.amount > 0 ? '€' : ''}
                      {cost.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </td>
                </tr>
              ))}

              <tr className="border-b bg-muted/30">
                <td className="py-2 px-2 font-semibold text-xs uppercase tracking-wide" colSpan={2}>
                  Cost Totals
                </td>
              </tr>

              <tr className="border-b">
                <td className="py-3 px-2 font-semibold">
                  Total Regulatory Costs
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="font-mono font-bold text-lg text-destructive">
                    €{regulatoryCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </td>
              </tr>

              <tr className="border-b-2 border-primary/40 bg-primary/5">
                <td className="py-4 px-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-base font-bold">{totalLabel}</span>
                  </div>
                </td>
                <td className="py-4 px-2 text-right">
                  <div className="text-2xl font-bold font-mono text-primary" data-testid="text-total-cost">
                    €{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20">
            <div className="text-xs text-muted-foreground font-semibold mb-1">EU ETS Coverage</div>
            <div className="text-sm text-muted-foreground">
              Emission allowances for EU operations
            </div>
          </div>
          <div className="p-3 border rounded-lg bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20">
            <div className="text-xs text-muted-foreground font-semibold mb-1">FuelEU Maritime</div>
            <div className="text-sm text-muted-foreground">
              GHG intensity compliance penalties
            </div>
          </div>
          <div className="p-3 border rounded-lg bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20">
            <div className="text-xs text-muted-foreground font-semibold mb-1">CII Rating Impact</div>
            <div className="text-sm text-muted-foreground">
              Operational efficiency requirements
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
