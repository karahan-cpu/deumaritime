import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateRequiredCII, getCIIRating } from "@/lib/calculations";

interface CIIForecastTableProps {
  shipType: string;
  capacity: number;
  attainedCII: number;
  startYear: number;
  endYear: number;
}

export function CIIForecastTable({ shipType, capacity, attainedCII, startYear, endYear }: CIIForecastTableProps) {
  const ratingColors = {
    A: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    B: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    C: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    D: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    E: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  };

  const forecastData = [];
  for (let year = startYear; year <= endYear; year++) {
    const requiredCII = calculateRequiredCII(shipType, capacity, year);
    const ratio = attainedCII / requiredCII;
    const rating = getCIIRating(attainedCII, requiredCII) as "A" | "B" | "C" | "D" | "E";
    forecastData.push({ year, requiredCII, ratio, rating });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">CII Rating Forecast ({startYear} - {endYear})</CardTitle>
        <p className="text-sm text-muted-foreground">
          Projected CII ratings assuming constant attained CII of {attainedCII.toFixed(2)} gCO₂/tonne-nm
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Required CII</TableHead>
                <TableHead className="text-right">Attained CII</TableHead>
                <TableHead className="text-right">Ratio</TableHead>
                <TableHead className="text-center">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecastData.map((row) => (
                <TableRow key={row.year}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell className="text-right font-mono">{row.requiredCII.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{attainedCII.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{(row.ratio * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-center">
                    <Badge className={ratingColors[row.rating]} variant="outline">
                      {row.rating}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

