import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label } from "recharts";
import { TrendingDown } from "lucide-react";

interface GHGIntensityChartProps {
  attainedGFI?: number; // IMO GFI attained intensity
  baseTarget?: number; // Current year base target
  directTarget?: number; // Current year direct target
}

export function GHGIntensityChart({ attainedGFI, baseTarget, directTarget }: GHGIntensityChartProps) {
  // IMO GFI baseline (2008)
  const baseline2008 = 93.3;

  // Define annual reduction targets (percentage reduction from baseline)
  // Modeled to match the visual "staircase" reference
  const reductionTargets: Record<number, { base: number; direct: number }> = {
    2028: { base: 0.04, direct: 0.17 },
    2029: { base: 0.06, direct: 0.19 },
    2030: { base: 0.08, direct: 0.21 }, // Matching typical 2030 checkpoints
    2031: { base: 0.11, direct: 0.24 },
    2032: { base: 0.14, direct: 0.27 },
    2033: { base: 0.17, direct: 0.30 },
    2034: { base: 0.20, direct: 0.33 },
    2035: { base: 0.25, direct: 0.38 }, // ZNZ Drop year
    2036: { base: 0.30, direct: 0.45 },
    2037: { base: 0.38, direct: 0.53 },
    2038: { base: 0.46, direct: 0.61 },
    2039: { base: 0.55, direct: 0.70 },
    2040: { base: 0.65, direct: 0.80 },
  };

  const chartData: any[] = [];

  // Generate data for each year from 2028 to 2040
  Object.keys(reductionTargets).forEach((yearStr) => {
    const year = parseInt(yearStr);
    const target = reductionTargets[year];

    // Calculate absolute values
    const yearBaseTarget = baseline2008 * (1 - target.base);
    const yearDirectTarget = baseline2008 * (1 - target.direct);

    // ZNZ Threshold: High (19.3) until 2034, then drops to ~13.5 from 2035
    const yearZNZ = year < 2035 ? 19.3 : 13.5;

    // Zones for stacking Area Chart (Bottom to Top)
    // 1. ZNZ Reward Zone (0 to ZNZ) -> Green
    // 2. Surplus Zone (ZNZ to Direct) -> White
    // 3. Tier 1 (Direct to Base) -> Light Blue
    // 4. Tier 2 (Base to Max) -> Dark Blue

    chartData.push({
      year,
      baseTarget: yearBaseTarget,
      directTarget: yearDirectTarget,
      znzThreshold: yearZNZ,

      // Areas for stacking
      znzZone: yearZNZ,
      surplusZone: Math.max(0, yearDirectTarget - yearZNZ),
      tier1Zone: Math.max(0, yearBaseTarget - yearDirectTarget),
      tier2Zone: Math.max(0, baseline2008 * 1.1 - yearBaseTarget),
    });
  });

  // Max limit for Y axis
  const maxLimit = 100;
  const yAxisMax = attainedGFI !== undefined
    ? Math.max(maxLimit, attainedGFI) * 1.05
    : maxLimit;

  // Custom Tick for ZNZ
  const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    if (Math.abs(payload.value - 19.3) < 1 && Math.abs(payload.value - 13.5) < 1) return null; // Skip near ZNZ
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" fill="#64748b" fontSize={12}>
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <Card data-testid="card-ghg-intensity-chart">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingDown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>IMO Net-Zero Framework</CardTitle>
            <CardDescription>
              GHG Fuel Intensity Targets (2028-2040)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart
            data={chartData}
            margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="tier2Fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="tier1Fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#bfdbfe" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#bfdbfe" stopOpacity={0.9} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={true} horizontal={true} />

            <XAxis
              dataKey="year"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              ticks={[2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040]}
            >
              <Label value="Year" position="insideBottom" offset={-10} style={{ fill: '#475569', fontSize: 13 }} />
            </XAxis>

            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              domain={[0, yAxisMax]}
              ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 93.3]}
            >
              <Label
                value="GHG Fuel Intensity (gCO₂eq/MJ)"
                angle={-90}
                position="insideLeft"
                style={{ fill: '#475569', fontSize: 13, textAnchor: 'middle' }}
              />
            </YAxis>

            <Tooltip
              formatter={(value: number, name: string) => {
                if (name.includes("Zone")) return null;
                return [value.toFixed(1), name];
              }}
              labelStyle={{ color: '#0f172a', fontWeight: 600 }}
              contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
            />

            {/* 1. ZNZ Reward Zone (Bottom Green) */}
            <Area
              type="stepAfter"
              dataKey="znzZone"
              stackId="1"
              stroke="#86efac"
              strokeWidth={2}
              fill="#dcfce7"
              fillOpacity={1}
              name="ZNZ Reward Zone"
              isAnimationActive={false}
            />

            {/* 2. Surplus Zone (White/Transparent in between) */}
            <Area
              type="stepAfter"
              dataKey="surplusZone"
              stackId="1"
              stroke="none"
              fill="#ffffff"
              fillOpacity={0}
              name="Surplus Zone"
              isAnimationActive={false}
            />

            {/* 3. Tier 1 Zone (Light Blue) */}
            <Area
              type="stepAfter"
              dataKey="tier1Zone"
              stackId="1"
              stroke="#bae6fd"
              fill="#bfdbfe"
              fillOpacity={1}
              name="Tier 1 Zone"
              isAnimationActive={false}
            />

            {/* 4. Tier 2 Zone (Dark Blue) */}
            <Area
              type="stepAfter"
              dataKey="tier2Zone"
              stackId="1"
              stroke="#60a5fa"
              fill="#60a5fa"
              fillOpacity={1}
              name="Tier 2 Zone"
              isAnimationActive={false}
            />

            {/* Lines on top for sharp edges */}
            <Line
              type="stepAfter"
              dataKey="baseTarget"
              stroke="#1e40af"
              strokeWidth={2}
              dot={false}
              name="Base Target"
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="directTarget"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="Direct Compliance Target"
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="znzThreshold"
              stroke="#15803d"
              strokeWidth={2}
              dot={false}
              name="ZNZ Threshold"
              isAnimationActive={false}
            />

            {/* Reference Line for Baseline */}
            <ReferenceLine y={93.3} stroke="#94a3b8" strokeDasharray="3 3">
              <Label value="2008 Baseline GFI (93.3)" position="insideTopRight" fill="#f8fafc" fontSize={10} />
            </ReferenceLine>

            {/* ZNZ Label */}
            <ReferenceLine y={19.3} stroke="none">
              <Label value="ZNZ Threshold" position="insideTopLeft" fill="#15803d" fontSize={11} offset={10} />
            </ReferenceLine>
            <ReferenceLine y={5} stroke="none">
              <Label value="ZNZ Reward" position="center" fill="#15803d" fontSize={10} className="bg-green-100 p-1 rounded" />
            </ReferenceLine>

            {/* Base Target Label */}
            <ReferenceLine y={94} stroke="none">
              <Label value="Base Target" position="insideTopLeft" fill="#1e40af" fontSize={11} />
            </ReferenceLine>

            {/* Direct Target Label */}
            <ReferenceLine y={80} stroke="none">
              <Label value="Direct Compliance Target" position="insideTopLeft" fill="#2563eb" fontSize={11} />
            </ReferenceLine>

            {/* Annotation Boxes */}
            <ReferenceLine x={2031} stroke="none">
              <Label
                value="$380 / t CO₂eq (Tier 2: 2028-30)"
                position="top"
                fill="#1e3a8a"
                offset={180}
                className="text-[10px] font-mono bg-white/80"
              />
            </ReferenceLine>
            <ReferenceLine x={2031} stroke="none">
              <Label
                value="$100 / t CO₂eq (Tier 1: 2028-30)"
                position="top"
                fill="#0f172a"
                offset={110}
                className="text-[10px] font-mono"
              />
            </ReferenceLine>

            {attainedGFI !== undefined && (
              <ReferenceLine
                y={attainedGFI}
                stroke="#dc2626"
                strokeWidth={3}
                strokeDasharray="5 5"
              >
                <Label
                  value={`Your GFI: ${attainedGFI.toFixed(1)}`}
                  position="right"
                  fill="#dc2626"
                  fontSize={12}
                  fontWeight={800}
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
