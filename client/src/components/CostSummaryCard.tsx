import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, TrendingUp } from "lucide-react";

interface CostItem {
  label: string;
  amount: number;
  description?: string;
}

interface CostSummaryCardProps {
  costs: CostItem[];
  totalLabel?: string;
}

export function CostSummaryCard({ costs, totalLabel = "Total Compliance Costs" }: CostSummaryCardProps) {
  const total = costs.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card data-testid="card-cost-summary">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Euro className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Cost Summary</CardTitle>
            <CardDescription>Annual compliance and penalty costs breakdown</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {costs.map((cost, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
              <div>
                <div className="font-medium">{cost.label}</div>
                {cost.description && (
                  <div className="text-sm text-muted-foreground">{cost.description}</div>
                )}
              </div>
              <div className="font-mono font-semibold text-lg">
                €{cost.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          ))}
          
          <div className="pt-4 mt-4 border-t-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">{totalLabel}</span>
              </div>
              <div className="text-3xl font-bold font-mono text-primary">
                €{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
