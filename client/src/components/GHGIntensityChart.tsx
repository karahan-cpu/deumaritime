import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label } from "recharts";
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

  const chartData = Object.entries(reductionTargets).map(([year, reduction]) => {
    const baseTarget = baseline * (1 - reduction);
    const directCompliance = baseTarget * 0.95;
    const tier1Upper = baseTarget * 1.2;
    const tier2Upper = baseTarget * 1.4;
    const threshold = 20;
    
    const greenZone = Math.min(threshold, baseTarget);
    const complianceZone = Math.max(0, baseTarget - greenZone);
    const tier1Zone = tier1Upper - baseTarget;
    const tier2Zone = tier2Upper - tier1Upper;
    
    return {
      year: parseInt(year),
      baseTarget,
      directCompliance,
      greenZone,
      complianceZone,
      tier1Zone,
      tier2Zone,
    };
  });

  const maxLimit = Math.max(...chartData.map(d => d.greenZone + d.complianceZone + d.tier1Zone + d.tier2Zone));
  const yAxisMax = attainedIntensity !== undefined 
    ? Math.max(maxLimit, attainedIntensity) * 1.05
    : maxLimit * 1.05;

  return (
    <Card data-testid="card-ghg-intensity-chart">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingDown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>FuelEU Maritime - GHG Intensity Limits</CardTitle>
            <CardDescription>
              Regulatory compliance framework (2025-2050)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="tier2Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="tier1Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#bfdbfe" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#f0f9ff" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="greenZone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#86efac" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#bbf7d0" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
            
            <XAxis
              dataKey="year"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={{ stroke: '#cbd5e1' }}
            >
              <Label value="Year" position="insideBottom" offset={-10} style={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} />
            </XAxis>
            
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={{ stroke: '#cbd5e1' }}
              domain={[0, yAxisMax]}
            >
              <Label 
                value="GHG Fuel Intensity (gCO₂eq/MJ)" 
                angle={-90} 
                position="insideLeft" 
                style={{ fill: '#475569', fontSize: 13, fontWeight: 600, textAnchor: 'middle' }}
              />
            </YAxis>
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: '#0f172a', fontWeight: 600, marginBottom: 8 }}
              formatter={(value: number, name: string) => {
                if (name === 'baseTarget' || name === 'directCompliance') {
                  const displayName = name === 'baseTarget' ? 'Base Target' : 'Direct Compliance';
                  return [value.toFixed(2) + ' gCO₂eq/MJ', displayName];
                }
                return null;
              }}
            />
            
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="line"
              wrapperStyle={{ paddingBottom: '10px' }}
            />

            <Area
              type="stepAfter"
              dataKey="greenZone"
              stackId="1"
              stroke="none"
              fill="url(#greenZone)"
              fillOpacity={1}
              name="Zero Emissions Incentive"
              isAnimationActive={false}
            />
            
            <Area
              type="stepAfter"
              dataKey="complianceZone"
              stackId="1"
              stroke="none"
              fill="url(#complianceGradient)"
              fillOpacity={1}
              name="Compliance Zone"
              isAnimationActive={false}
            />
            
            <Area
              type="stepAfter"
              dataKey="tier1Zone"
              stackId="1"
              stroke="none"
              fill="url(#tier1Gradient)"
              fillOpacity={1}
              name="Penalty Zone (Tier 1)"
              isAnimationActive={false}
            />

            <Area
              type="stepAfter"
              dataKey="tier2Zone"
              stackId="1"
              stroke="none"
              fill="url(#tier2Gradient)"
              fillOpacity={1}
              name="High Penalty Zone (Tier 2)"
              isAnimationActive={false}
            />
            
            <Line
              type="stepAfter"
              dataKey="baseTarget"
              stroke="#2563eb"
              strokeWidth={3}
              name="Base Target"
              dot={false}
              isAnimationActive={false}
            />
            
            <Line
              type="stepAfter"
              dataKey="directCompliance"
              stroke="#0284c7"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Direct Compliance Target"
              dot={false}
              isAnimationActive={false}
            />

            <ReferenceLine
              y={20}
              stroke="#059669"
              strokeWidth={2}
              strokeDasharray="3 3"
            >
              <Label 
                value="ZN2 Threshold (20 gCO₂eq/MJ)" 
                position="insideBottomLeft" 
                fill="#059669"
                fontSize={11}
                fontWeight={600}
              />
            </ReferenceLine>
            
            {attainedIntensity !== undefined && (
              <ReferenceLine
                y={attainedIntensity}
                stroke="#dc2626"
                strokeWidth={3}
                strokeDasharray="5 5"
              >
                <Label 
                  value={`Your Intensity: ${attainedIntensity.toFixed(2)} gCO₂eq/MJ`}
                  position="top"
                  fill="#dc2626"
                  fontSize={12}
                  fontWeight={600}
                />
              </ReferenceLine>
            )}
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20" data-testid="metric-2025-limit">
            <div className="text-muted-foreground font-semibold">2025 Limit</div>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400" data-testid="text-2025-limit-value">
              {(baseline * (1 - 0.02)).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">gCO₂eq/MJ</div>
          </div>
          <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20" data-testid="metric-2035-limit">
            <div className="text-muted-foreground font-semibold">2035 Limit</div>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400" data-testid="text-2035-limit-value">
              {(baseline * (1 - 0.145)).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">gCO₂eq/MJ</div>
          </div>
          <div className="p-3 border rounded-lg bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20" data-testid="metric-2050-target">
            <div className="text-muted-foreground font-semibold">2050 Target</div>
            <div className="text-xl font-bold font-mono text-green-600 dark:text-green-400" data-testid="text-2050-target-value">
              {(baseline * (1 - 0.80)).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">gCO₂eq/MJ (-80%)</div>
          </div>
          <div className="p-3 border rounded-lg bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20">
            <div className="text-muted-foreground font-semibold">ZN2 Threshold</div>
            <div className="text-xl font-bold font-mono text-green-600 dark:text-green-400">20.00</div>
            <div className="text-xs text-muted-foreground">Zero Emissions Goal</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
          <h4 className="font-semibold mb-2 text-sm">Penalty Tiers</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-700 mt-0.5"></div>
              <div>
                <div className="font-semibold">Tier 1 Penalty Zone</div>
                <div className="text-muted-foreground">€100/t CO₂eq shortfall (2025-2030)</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-600 dark:to-blue-500 mt-0.5"></div>
              <div>
                <div className="font-semibold">Tier 2 High Penalty Zone</div>
                <div className="text-muted-foreground">€380/t CO₂eq shortfall (2028-2030+)</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 mt-0.5"></div>
              <div>
                <div className="font-semibold">Compliance Zone</div>
                <div className="text-muted-foreground">Below direct compliance target - no penalty</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-green-200 to-green-300 dark:from-green-800 dark:to-green-700 mt-0.5"></div>
              <div>
                <div className="font-semibold">Zero Emissions Incentive</div>
                <div className="text-muted-foreground">Below 20 gCO₂eq/MJ - banking allowed</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
