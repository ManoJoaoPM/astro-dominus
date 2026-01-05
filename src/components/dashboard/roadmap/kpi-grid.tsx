import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiItem {
  label: string;
  value: string;
  trend: number; // percentage
}

export function KpiGrid({ kpis }: { kpis: KpiItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {kpis.map((kpi, idx) => (
        <Card key={idx}>
          <CardContent className="p-4 flex justify-between items-center">
             <div>
               <p className="text-sm text-muted-foreground">{kpi.label}</p>
               <p className="text-2xl font-bold mt-1">{kpi.value}</p>
             </div>
             <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full", 
               kpi.trend > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
             )}>
               {kpi.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
               {Math.abs(kpi.trend)}%
             </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
