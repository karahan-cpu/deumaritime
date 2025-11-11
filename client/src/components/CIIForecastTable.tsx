import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="sticky left-0 z-20 bg-background px-4 py-3 text-left font-medium text-muted-foreground min-w-[150px] border-r">
                    Vessel name
                  </th>
                  {years.map((year) => (
                    <th key={year} className="px-3 py-3 text-center font-medium text-muted-foreground min-w-[60px] whitespace-nowrap">
                      {year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="sticky left-0 z-10 bg-background px-4 py-3 font-medium border-r">
                    {displayName}
                  </td>
                  {forecastData.map((data) => {
                    const colors = data.isForecast ? ratingColorsDull : ratingColorsBright;
                    return (
                      <td 
                        key={data.year} 
                        className={`px-3 py-3 text-center font-bold text-sm whitespace-nowrap ${colors[data.rating]}`}
                      >
                        {data.rating}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

