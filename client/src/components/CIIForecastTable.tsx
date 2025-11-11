import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateRequiredCII, getCIIRating } from "@/lib/calculations";

interface CIIForecastTableProps {
  vesselName?: string;
  shipType: string;
  capacity: number;
  attainedCII: number;
  startYear: number;
  endYear: number;
  currentYear?: number; // Year of actual data (before this is forecast)
}

export function CIIForecastTable({ 
  vesselName, 
  shipType, 
  capacity, 
  attainedCII, 
  startYear, 
  endYear,
  currentYear 
}: CIIForecastTableProps) {
  // Bright colors for actual data (if currentYear is set)
  const ratingColorsBright = {
    A: "bg-green-500 text-white",
    B: "bg-blue-500 text-white",
    C: "bg-yellow-400 text-gray-900",
    D: "bg-orange-500 text-white",
    E: "bg-red-500 text-white",
  };

  // Dull colors for forecasted data
  const ratingColorsDull = {
    A: "bg-green-200 dark:bg-green-800/40 text-green-800 dark:text-green-200",
    B: "bg-blue-200 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200",
    C: "bg-yellow-200 dark:bg-yellow-800/40 text-yellow-800 dark:text-yellow-200",
    D: "bg-orange-200 dark:bg-orange-800/40 text-orange-800 dark:text-orange-200",
    E: "bg-red-200 dark:bg-red-800/40 text-red-800 dark:text-red-200",
  };

  const forecastData = [];
  for (let year = startYear; year <= endYear; year++) {
    const requiredCII = calculateRequiredCII(shipType, capacity, year);
    const rating = getCIIRating(attainedCII, requiredCII) as "A" | "B" | "C" | "D" | "E";
    const isForecast = currentYear ? year > currentYear : true;
    forecastData.push({ year, rating, isForecast });
  }

  const years = forecastData.map(d => d.year);
  const displayName = vesselName || `${shipType} (${capacity.toLocaleString()} DWT)`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">CII Rating Forecast</CardTitle>
        <p className="text-sm text-muted-foreground">
          Forecasted ratings in dull colors. Assumes constant attained CII of {attainedCII.toFixed(2)} gCO₂/tonne-nm
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-background min-w-[150px]">Vessel name</TableHead>
                {years.map((year) => (
                  <TableHead key={year} className="text-center min-w-[60px]">
                    {year}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium sticky left-0 z-10 bg-background">
                  {displayName}
                </TableCell>
                {forecastData.map((data) => {
                  const colors = data.isForecast ? ratingColorsDull : ratingColorsBright;
                  return (
                    <TableCell 
                      key={data.year} 
                      className={`text-center font-bold text-sm ${colors[data.rating]}`}
                    >
                      {data.rating}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

