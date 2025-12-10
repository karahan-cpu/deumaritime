import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CIIForecastTableProps {
  data: Array<{
    year: number;
    required: number;
    attained?: number;
    attainedRating?: string;
    adjusted?: number;
    adjustedRating?: string;
  }>;
}

export function CIIForecastTable({ data }: CIIForecastTableProps) {
  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'A': return 'bg-green-500 text-white';
      case 'B': return 'bg-green-300 text-black';
      case 'C': return 'bg-yellow-300 text-black';
      case 'D': return 'bg-orange-500 text-white';
      case 'E': return 'bg-red-500 text-white';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-blue-50">
          <TableRow>
            <TableHead>Year</TableHead>
            {data.map(d => (
              <TableHead key={d.year} className="text-center text-xs px-1">{d.year}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Required CII Row */}
          <TableRow>
            <TableCell className="font-semibold text-xs whitespace-nowrap bg-gray-50">Required CII<br />(gCO2/t.nm)</TableCell>
            {data.map(d => (
              <TableCell key={d.year} className="text-center text-xs">{d.required.toFixed(3)}</TableCell>
            ))}
          </TableRow>

          {/* Attained CII Row */}
          <TableRow>
            <TableCell className="font-semibold text-xs whitespace-nowrap">Attained CII<br />(gCO2/t.nm)</TableCell>
            {data.map(d => (
              <TableCell key={d.year} className="text-center text-xs">
                {d.attained ? d.attained.toFixed(3) : '-'}
              </TableCell>
            ))}
          </TableRow>

          {/* Attained Rating Row */}
          <TableRow>
            <TableCell className="font-semibold text-xs whitespace-nowrap bg-gray-50">Attained<br />Rating</TableCell>
            {data.map(d => (
              <TableCell key={d.year} className={`text-center text-xs font-bold ${d.attainedRating ? getRatingColor(d.attainedRating) : ''}`}>
                {d.attainedRating || '-'}
              </TableCell>
            ))}
          </TableRow>

          {/* Adjusted CII Row (Placeholder if needed) */}
          {/* 
           <TableRow>
            <TableCell className="font-semibold text-xs whitespace-nowrap">Adjusted CII<br/>(gCO2/t.nm)</TableCell>
            {data.map(d => (
              <TableCell key={d.year} className="text-center text-xs">
                {d.adjusted ? d.adjusted.toFixed(3) : '-'}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-semibold text-xs whitespace-nowrap bg-gray-50">Adjusted<br/>Rating</TableCell>
            {data.map(d => (
              <TableCell key={d.year} className={`text-center text-xs font-bold ${d.adjustedRating ? getRatingColor(d.adjustedRating) : ''}`}>
                 {d.adjustedRating || '-'}
              </TableCell>
            ))}
          </TableRow> 
          */}
        </TableBody>
      </Table>
    </div>
  );
}
