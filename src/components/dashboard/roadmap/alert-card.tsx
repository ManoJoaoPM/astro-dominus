import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AlertCardProps {
  title: string;
  origin: string;
  priority: "high" | "medium" | "low";
  linkHref: string;
}

export function AlertCard({ title, origin, priority, linkHref }: AlertCardProps) {
  const priorityConfig = {
    high: { bg: "bg-red-50", border: "border-red-100", text: "text-red-700", label: "High Priority" },
    medium: { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", label: "Medium Priority" },
    low: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", label: "Low Priority" },
  };

  const config = priorityConfig[priority];

  return (
    <Link href={linkHref} className="block group">
      <div className={cn("flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-sm", config.bg, config.border)}>
         <div className="flex items-start gap-3">
           <AlertTriangle className={cn("w-5 h-5 mt-0.5", config.text)} />
           <div className="space-y-1">
             <p className="font-medium text-sm text-foreground">{title}</p>
             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold uppercase text-xs">{origin}</span>
                <span>•</span>
                <span className={cn("font-medium uppercase", config.text)}>{config.label}</span>
             </div>
           </div>
         </div>
         <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  );
}
