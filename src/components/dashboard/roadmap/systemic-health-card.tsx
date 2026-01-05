import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export function SystemicHealthCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Saúde Sistêmica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
           <HealthItem label="Eficiência Global" value={98} />
           <HealthItem label="Qualidade de Lead" value={64} color="bg-amber-500" />
           <HealthItem label="Conversão Booking" value={12} color="bg-red-500" />
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 space-y-2">
           <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm">
             <Activity className="w-4 h-4" />
             <span>Recomendação Dominus</span>
           </div>
           <p className="text-xs text-orange-800 leading-relaxed">
             Identificamos um gargalo severo no <strong>Booking</strong>. O time comercial está demorando muito para o primeiro contato. Reduzir para sub-5min pode triplicar o volume de visitas.
           </p>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthItem({ label, value, color = "bg-emerald-500" }: { label: string, value: number, color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold">{value}%</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
