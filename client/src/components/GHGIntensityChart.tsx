import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label } from "recharts";
import { TrendingDown } from "lucide-react";

interface GHGIntensityChartProps {
  attainedGFI?: number; // IMO GFI attained intensity
  baseTarget?: number; // Current year base target
  directTarget?: number; // Current year direct target
}

export function GHGIntensityChart({ attainedGFI, baseTarget, directTarget }: GHGIntensityChartProps) {
  const baseline2008 = 93.3; // IMO GFI baseline (2008)
  
  const reductionTargets: Record<number, { base: number; direct: number }> = {
    2028: { base: 0.04, direct: 0.17 },
    2029: { base: 0.06, direct: 0.21 },
    2030: { base: 0.08, direct: 0.21 },
    2031: { base: 0.10, direct: 0.25 },
    2032: { base: 0.12, direct: 0.29 },
    2033: { base: 0.15, direct: 0.33 },
    2034: { base: 0.20, direct: 0.38 },
    2035: { base: 0.30, direct: 0.43 },
    2036: { base: 0.35, direct: 0.48 },
    2037: { base: 0.40, direct: 0.53 },
    2038: { base: 0.45, direct: 0.58 },
    2039: { base: 0.55, direct: 0.69 },
    2040: { base: 0.65, direct: 0.80 },
  };

  const chartData = Object.entries(reductionTargets).map(([year, targets]) => {
    const yearBaseTarget = baseline2008 * (1 - targets.base);
    const yearDirectTarget = baseline2008 * (1 - targets.direct);
    
    // Zones for IMO GFI:
    // - Surplus zone: below direct target (green)
    // - Tier 1 zone: between direct and base target (yellow/amber)
    // - Tier 2 zone: above base target (red)
    const surplusZone = yearDirectTarget;
    const tier1Zone = yearBaseTarget - yearDirectTarget;
    const tier2Zone = baseline2008 - yearBaseTarget; // Above base target
    
    return {
      year: parseInt(year),
      baseTarget: yearBaseTarget,
      directTarget: yearDirectTarget,
      surplusZone,
      tier1Zone,
      tier2Zone,
    };
  });

  // Max limit should be the baseline (2008) since zones are stacked up to baseline
  const maxLimit = baseline2008;
  const yAxisMax = attainedGFI !== undefined 
    ? Math.max(maxLimit, attainedGFI) * 1.05
    : maxLimit * 1.05;

  return (
    <Card data-testid="card-ghg-intensity-chart">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingDown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>IMO GHG Fuel Intensity (GFI)</CardTitle>
            <CardDescription>
              Two-tier GHG pricing framework (2028-2040)
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
                if (name === 'baseTarget' || name === 'directTarget') {
                  const displayName = name === 'baseTarget' ? 'Base Target' : 'Direct Target';
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
              dataKey="surplusZone"
              stackId="1"
              stroke="none"
              fill="url(#greenZone)"
              fillOpacity={1}
              name="Surplus Zone (No Penalty)"
              isAnimationActive={false}
            />
            
            <Area
              type="stepAfter"
              dataKey="tier1Zone"
              stackId="1"
              stroke="none"
              fill="url(#tier1Gradient)"
              fillOpacity={1}
              name="Tier 1 Penalty Zone ($100/tCO₂eq)"
              isAnimationActive={false}
            />

            <Area
              type="stepAfter"
              dataKey="tier2Zone"
              stackId="1"
              stroke="none"
              fill="url(#tier2Gradient)"
              fillOpacity={1}
              name="Tier 2 Penalty Zone ($380/tCO₂eq)"
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
              dataKey="directTarget"
              stroke="#0284c7"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Direct Compliance Target"
              dot={false}
              isAnimationActive={false}
            />
            
            {attainedGFI !== undefined && (
              <ReferenceLine
                y={attainedGFI}
                stroke="#dc2626"
                strokeWidth={3}
                strokeDasharray="5 5"
              >
                <Label 
                  value={`Your GFI: ${attainedGFI.toFixed(2)} gCO₂eq/MJ`}
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
          <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20" data-testid="metric-2028-base">
            <div className="text-muted-foreground font-semibold">2028 Base Target</div>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400" data-testid="text-2028-base-value">
              {(baseline2008 * (1 - 0.04)).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">gCO₂eq/MJ</div>
          </div>
          <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20" data-testid="metric-2035-base">
            <div className="text-muted-foreground font-semibold">2035 Base Target</div>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400" data-testid="text-2035-base-value">
              {(baseline2008 * (1 - 0.30)).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">gCO₂eq/MJ</div>
          </div>
          <div className="p-3 border rounded-lg bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20" data-testid="metric-2040-base">
            <div className="text-muted-foreground font-semibold">2040 Base Target</div>
            <div className="text-xl font-bold font-mono text-green-600 dark:text-green-400" data-testid="text-2040-base-value">
              {(baseline2008 * (1 - 0.65)).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">gCO₂eq/MJ (-65%)</div>
          </div>
          {attainedGFI !== undefined && (
            <div className="p-3 border rounded-lg bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20">
              <div className="text-muted-foreground font-semibold">Your Attained GFI</div>
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{attainedGFI.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">gCO₂eq/MJ</div>
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
          <h4 className="font-semibold mb-2 text-sm">IMO GFI Penalty Tiers</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-green-200 to-green-300 dark:from-green-800 dark:to-green-700 mt-0.5"></div>
              <div>
                <div className="font-semibold">Surplus Zone</div>
                <div className="text-muted-foreground">Below direct target - no penalty, banking allowed</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-700 mt-0.5"></div>
              <div>
                <div className="font-semibold">Tier 1 Penalty Zone</div>
                <div className="text-muted-foreground">$100/t CO₂eq between direct and base target</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-600 dark:to-blue-500 mt-0.5"></div>
              <div>
                <div className="font-semibold">Tier 2 Penalty Zone</div>
                <div className="text-muted-foreground">$380/t CO₂eq above base target</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 mt-0.5"></div>
              <div>
                <div className="font-semibold">Baseline (2008)</div>
                <div className="text-muted-foreground">93.3 gCO₂eq/MJ reference value</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
