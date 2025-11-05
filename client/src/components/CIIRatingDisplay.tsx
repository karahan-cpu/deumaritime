import { Card } from "@/components/ui/card";

interface CIIRatingDisplayProps {
  rating: "A" | "B" | "C" | "D" | "E";
  attainedCII: number;
  requiredCII: number;
}

export function CIIRatingDisplay({ rating, attainedCII, requiredCII }: CIIRatingDisplayProps) {
  const ratingColors = {
    A: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    B: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    C: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    D: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    E: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  };

  const ratingDescriptions = {
    A: "Major Superior Performance",
    B: "Minor Superior Performance",
    C: "Moderate Performance (Acceptable)",
    D: "Minor Inferior Performance",
    E: "Inferior Performance",
  };

  return (
    <Card className={`p-6 border-2 ${ratingColors[rating]}`} data-testid="card-cii-rating">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">CII Rating</div>
          <div className={`text-6xl font-bold font-mono ${ratingColors[rating]}`}>{rating}</div>
          <div className="text-sm font-medium mt-2">{ratingDescriptions[rating]}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Attained CII</div>
          <div className="text-2xl font-bold font-mono">{attainedCII.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground mt-3">Required CII</div>
          <div className="text-lg font-semibold font-mono">{requiredCII.toFixed(2)}</div>
        </div>
      </div>
    </Card>
  );
}
