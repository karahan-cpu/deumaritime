import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Scatter, ComposedChart, ReferenceLine, Label } from "recharts";
import { TrendingDown } from "lucide-react";

interface CIIChartProps {
    data: Array<{
        year: number;
        required: number;
        attained?: number;
        adjusted?: number;
        // Band limits
        limitA: number; // 0.88 * Required
        limitB: number; // 0.94 * Required
        limitC: number; // 1.06 * Required
        limitD: number; // 1.18 * Required
    }>;
}

export function CIIChart({ data }: CIIChartProps) {
    // Transform data for stacked chart
    // We want bands:
    // Green (A): 0 -> limitA
    // Light Green (B): limitA -> limitB
    // Yellow (C): limitB -> limitC
    // Orange (D): limitC -> limitD
    // Red (E): limitD -> Max

    const formattedData = data.map(d => ({
        ...d,
        bandA: d.limitA,
        bandB: d.limitB - d.limitA,
        bandC: d.limitC - d.limitB,
        bandD: d.limitD - d.limitC,
        bandE: (d.limitD * 1.5) - d.limitD, // Arbitrary top
    }));

    const maxVal = Math.max(...data.map(d => d.limitD * 1.5));

    return (
        <Card>
            <CardHeader>
                <CardTitle>CII Rating Projection (2019-2030)</CardTitle>
                <CardDescription>Estimated rating bands and vessel performance</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={formattedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="year" type="number" domain={[2019, 2030]} tickCount={12} />
                        <YAxis label={{ value: 'AER (gCO2/t.nm)', angle: -90, position: 'insideLeft' }} domain={[0, maxVal]} />
                        <Tooltip />

                        {/* Stacked Areas for Bands */}
                        <Area type="monotone" dataKey="bandA" stackId="1" stroke="none" fill="#22c55e" name="Rating A" />
                        <Area type="monotone" dataKey="bandB" stackId="1" stroke="none" fill="#86efac" name="Rating B" />
                        <Area type="monotone" dataKey="bandC" stackId="1" stroke="none" fill="#fde047" name="Rating C" />
                        <Area type="monotone" dataKey="bandD" stackId="1" stroke="none" fill="#f97316" name="Rating D" />
                        <Area type="monotone" dataKey="bandE" stackId="1" stroke="none" fill="#ef4444" name="Rating E" />

                        {/* Required Line */}
                        <Line type="monotone" dataKey="required" stroke="#000000" strokeWidth={2} dot={false} name="Required CII" />

                        {/* Points */}
                        <Scatter name="Attained CII" dataKey="attained" fill="#000000" shape="cross" size={100} />
                        {/* <Scatter name="Adjusted CII" dataKey="adjusted" fill="#555555" shape="circle" /> */}
                    </ComposedChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4 text-xs font-medium">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div>A</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-300 rounded-sm"></div>B</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-300 rounded-sm"></div>C</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded-sm"></div>D</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div>E</div>
                </div>
            </CardContent>
        </Card>
    );
}
