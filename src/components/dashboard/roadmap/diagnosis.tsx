import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function Diagnosis({ status, text }: { status: string, text: string }) {
  return (
    <Card className="bg-emerald-50/50 border-emerald-100">
      <CardHeader className="pb-2">
         <div className="flex items-center gap-2">
           <CheckCircle2 className="w-5 h-5 text-emerald-600" />
           <CardTitle className="text-base text-emerald-800">{status}</CardTitle>
         </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-emerald-700 leading-relaxed">
          {text}
        </p>
      </CardContent>
    </Card>
  )
}
