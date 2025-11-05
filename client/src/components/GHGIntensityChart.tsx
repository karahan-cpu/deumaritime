import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingDown } from "lucide-react";

interface GHGIntensityChartProps {
  attainedIntensity?: number;
}

export function GHGIntensityChart({ attainedIntensity }: GHGIntensityChartProps) {
  const baseline = 91.16;
  
  const reductionTargets: Record<number, number> = {
    2025: 0.02, 2026: 0.02,
    2027: 0.04, 2028: 0.05, 2029: 0.056,
    2030: 0.06, 2031: 0.08, 2032: 0.10, 2033: 0.12, 2034: 0.135,
    2035: 0.145, 2036: 0.18, 2037: 0.21, 2038: 0.25, 2039: 0.285,
    2040: 0.31, 2041: 0.37, 2042: 0.43, 2043: 0.50, 2044: 0.565,
    2045: 0.62, 2046: 0.68, 2047: 0.73, 2048: 0.77, 2049: 0.785,
    2050: 0.80,
  };

  const chartData = Object.entries(reductionTargets).map(([year, reduction]) => ({
    year: parseInt(year),
    limit: baseline * (1 - reduction),
  }));

  const maxLimit = Math.max(...chartData.map(d => d.limit));
  const yAxisMax = attainedIntensity !== undefined 
    ? Math.max(maxLimit, attainedIntensity) * 1.1
    : maxLimit * 1.1;

  return (
    <Card data-testid="card-ghg-intensity-chart">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingDown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>GHG Fuel Intensity Trajectory</CardTitle>
            <CardDescription>
              FuelEU Maritime regulatory limits (2025-2050)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="year"
              label={{ value: "Year", position: "insideBottom", offset: -5 }}
              className="text-xs"
            />
            <YAxis
              label={{ value: "GHG Intensity (gCO₂eq/MJ)", angle: -90, position: "insideLeft" }}
              domain={[0, yAxisMax]}
              className="text-xs"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [value.toFixed(2), "Limit"]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="limit"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Regulatory Limit"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            {attainedIntensity !== undefined && (
              <ReferenceLine
                y={attainedIntensity}
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: `Your Intensity: ${attainedIntensity.toFixed(2)}`,
                  position: "right",
                  fill: "hsl(var(--destructive))",
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 border rounded-lg" data-testid="metric-2025-limit">
            <div className="text-muted-foreground">2025 Limit</div>
            <div className="text-lg font-bold font-mono" data-testid="text-2025-limit-value">{(baseline * (1 - 0.02)).toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">gCO₂eq/MJ</div>
          </div>
          <div className="p-3 border rounded-lg" data-testid="metric-2035-limit">
            <div className="text-muted-foreground">2035 Limit</div>
            <div className="text-lg font-bold font-mono" data-testid="text-2035-limit-value">{(baseline * (1 - 0.145)).toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">gCO₂eq/MJ</div>
          </div>
          <div className="p-3 border rounded-lg" data-testid="metric-2050-target">
            <div className="text-muted-foreground">2050 Target</div>
            <div className="text-lg font-bold font-mono" data-testid="text-2050-target-value">{(baseline * (1 - 0.80)).toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">gCO₂eq/MJ (-80%)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
