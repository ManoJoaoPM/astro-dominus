import * as React from "react"
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ChecklistItem {
  id: string;
  label: string;
  status: "success" | "warning" | "error";
  meta: string;
  definition?: string;
  action?: string;
}

export function Checklist({ items }: { items: ChecklistItem[] }) {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <Collapsible 
            key={item.id} 
            open={openItems.includes(item.id)} 
            onOpenChange={() => toggleItem(item.id)}
            className="border rounded-lg bg-card transition-all"
        >
          <div className="flex items-center justify-between p-4">
             <div className="flex items-center gap-3">
               <div className={cn("p-2 rounded-full", 
                 item.status === 'success' ? 'bg-emerald-100' : 'bg-amber-100'
               )}>
                 {item.status === 'success' ? (
                   <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                 ) : (
                   <AlertCircle className="w-5 h-5 text-amber-600" />
                 )}
               </div>
               <div>
                 <p className="font-semibold text-sm">{item.label}</p>
                 <p className="text-xs text-muted-foreground">{item.meta}</p>
               </div>
             </div>
             
             <CollapsibleTrigger asChild>
               <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
                 {openItems.includes(item.id) ? (
                   <ChevronUp className="h-4 w-4" />
                 ) : (
                   <ChevronDown className="h-4 w-4" />
                 )}
                 <span className="sr-only">Toggle</span>
               </Button>
             </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="px-4 pb-4 pt-0 text-sm text-muted-foreground border-t bg-muted/20">
             <div className="pt-4 space-y-2">
                {item.definition && <p><strong>Definição:</strong> {item.definition}</p>}
                {item.action && <p><strong>Ação recomendada:</strong> {item.action}</p>}
             </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}
