import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle, CircleDashed } from "lucide-react";
import Link from "next/link";

export type PhaseStatus = "saudavel" | "atencao" | "critico" | "sem_dados";

interface PhaseCardProps {
  phaseId: string;
  name: string;
  status: PhaseStatus;
  score: number;
  question: string;
  clientId: string;
}

const statusConfig = {
  saudavel: {
    label: "Saudável",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    barColor: "bg-emerald-500",
    icon: CheckCircle2,
    borderColor: "border-t-emerald-500",
  },
  atencao: {
    label: "Atenção",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    barColor: "bg-amber-500",
    icon: AlertCircle,
    borderColor: "border-t-amber-500",
  },
  critico: {
    label: "Crítico",
    color: "text-red-600",
    bgColor: "bg-red-50",
    barColor: "bg-red-500",
    icon: XCircle,
    borderColor: "border-t-red-500",
  },
  sem_dados: {
    label: "Sem dados",
    color: "text-gray-400",
    bgColor: "bg-gray-50",
    barColor: "bg-gray-300",
    icon: CircleDashed,
    borderColor: "border-t-gray-300",
  },
};

export function PhaseCard({ phaseId, name, status, score, question, clientId }: PhaseCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Link href={`/dashboard/clients/${clientId}/roadmap/${phaseId}`} className="block h-full group">
      <Card className={cn("h-full transition-all hover:shadow-md cursor-pointer border-t-4", config.borderColor)}>
        <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
          <div className="flex justify-between items-start">
             <div className="space-y-1">
               <span className="text-xs text-muted-foreground uppercase tracking-wider">Fase {phaseId === 'spy' ? '1' : phaseId === 'pickup' ? '2' : phaseId === 'generate' ? '3' : phaseId === 'booking' ? '4' : '5'}</span>
               <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{name}</h3>
             </div>
             <Icon className={cn("w-5 h-5", config.color)} />
          </div>

          <div className="space-y-2">
             <div className="flex justify-between items-end">
               <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
               <div className="flex items-baseline gap-1">
                 <span className="text-2xl font-bold">{score}</span>
                 <span className="text-xs text-muted-foreground">/100</span>
               </div>
             </div>
             <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
               <div className={cn("h-full rounded-full transition-all duration-500", config.barColor)} style={{ width: `${score}%` }} />
             </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2 pt-4 border-t line-clamp-2">
            {question}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
