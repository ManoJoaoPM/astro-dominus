import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendLabel?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon: LucideIcon;
  iconClassName?: string;
}

export function MetricCard({
  title,
  value,
  trendLabel,
  trendDirection = "neutral",
  icon: Icon,
  iconClassName,
}: MetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col justify-between h-full gap-4">
        <div className="flex justify-between items-start">
           <div className={cn("p-2 rounded-lg bg-primary/10", iconClassName)}>
            <Icon className="w-5 h-5 text-primary" />
           </div>
           {trendLabel && (
             <span className={cn("text-xs font-medium px-2 py-1 rounded-full", 
                trendDirection === "up" ? "bg-emerald-100 text-emerald-700" :
                trendDirection === "down" ? "bg-red-100 text-red-700" : 
                "bg-gray-100 text-gray-700"
             )}>
               {trendLabel}
             </span>
           )}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
