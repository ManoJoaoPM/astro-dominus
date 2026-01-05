export function Timeline({ events }: { events: { date: string, description: string }[] }) {
  return (
    <div className="space-y-4 ml-2">
       {events.map((event, idx) => (
         <div key={idx} className="relative pl-6 border-l-2 border-muted pb-4 last:pb-0 last:border-0">
           <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-orange-500" />
           <p className="text-xs font-semibold text-muted-foreground">{event.date}</p>
           <p className="text-sm font-medium mt-0.5">{event.description}</p>
         </div>
       ))}
    </div>
  )
}
