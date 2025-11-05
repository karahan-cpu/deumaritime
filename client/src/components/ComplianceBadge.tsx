import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface ComplianceBadgeProps {
  status: "compliant" | "warning" | "non-compliant";
  label?: string;
}

export function ComplianceBadge({ status, label }: ComplianceBadgeProps) {
  const variants = {
    compliant: {
      icon: CheckCircle2,
      text: label || "Compliant",
      className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    },
    warning: {
      icon: AlertTriangle,
      text: label || "Warning",
      className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    },
    "non-compliant": {
      icon: XCircle,
      text: label || "Non-Compliant",
      className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    },
  };

  const { icon: Icon, text, className } = variants[status];

  return (
    <Badge className={`gap-1.5 ${className}`} data-testid={`badge-compliance-${status}`}>
      <Icon className="h-3.5 w-3.5" />
      {text}
    </Badge>
  );
}
