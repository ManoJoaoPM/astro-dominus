"use client";

import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { MetricCard } from "@/components/dashboard/roadmap/metric-card";
import { PhaseCard, PhaseStatus } from "@/components/dashboard/roadmap/phase-card";
import { AlertCard } from "@/components/dashboard/roadmap/alert-card";
import { SystemicHealthCard } from "@/components/dashboard/roadmap/systemic-health-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Target, Clock, Activity, CreditCard } from "lucide-react";

// Mock data
const phases = [
  { id: "spy", name: "Spy", status: "atencao", score: 65, question: "Estamos medindo corretamente?" },
  { id: "pickup", name: "Pick Up", status: "saudavel", score: 88, question: "A geração de leads está saudável?" },
  { id: "generate", name: "Generate Lead", status: "saudavel", score: 92, question: "A geração de leads supre o esperado?" },
  { id: "booking", name: "Booking", status: "critico", score: 42, question: "O cliente consegue agendar visitas?" },
  { id: "escala", name: "Escala", status: "sem_dados", score: 0, question: "O sistema se paga?" },
] as const;

const alerts = [
  { title: "Tempo de resposta acima de 20 min (Booking)", origin: "CRM", priority: "high", linkHref: "#" },
  { title: "Funil no CRM divergente do planejado (Spy)", origin: "Spy", priority: "medium", linkHref: "#" },
  { title: "Connect Rate abaixo da meta (Pick Up)", origin: "CRM", priority: "low", linkHref: "#" },
] as const;

export default function RoadmapPage() {
  const { clientId } = useParams() as { clientId: string };
  // In a real app, I would fetch client data here.
  const clientName = "Imobiliária Alpha"; // Mock for MVP

  return (
    <>
      <SiteHeader
        heading={[
          { link: "/dashboard/clients", label: "Clientes" },
          { link: `/dashboard/clients/${clientId}`, label: clientName },
          { link: "#", label: "Roadmap Estratégico" },
        ]}
      />
      
      <div className="p-6 max-w-[1600px] mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Visualizando Dashboard de:
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{clientName}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Select defaultValue="30">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard 
            title="Total Leads" 
            value="854" 
            trendLabel="+12%" 
            trendDirection="up" 
            icon={Users} 
            iconClassName="text-orange-600 bg-orange-100"
          />
          <MetricCard 
            title="% MQL" 
            value="42%" 
            trendLabel="+2%" 
            trendDirection="up" 
            icon={Target}
            iconClassName="text-orange-600 bg-orange-100" 
          />
          <MetricCard 
            title="Tempo Resp." 
            value="18min" 
            trendLabel="-5min" 
            trendDirection="up" 
            icon={Clock} 
            iconClassName="text-orange-600 bg-orange-100"
          />
          <MetricCard 
            title="Visitas" 
            value="45" 
            trendLabel="+8" 
            trendDirection="up" 
            icon={Activity} 
            iconClassName="text-orange-600 bg-orange-100"
          />
          <MetricCard 
            title="CAC Est." 
            value="R$ 120,00" 
            trendLabel="R$ 0" 
            trendDirection="neutral" 
            icon={CreditCard} 
            iconClassName="text-orange-600 bg-orange-100"
          />
        </div>

        {/* Phases Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold">Fases da Tese de Negócio</h2>
             <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Sync: Hoje, 10:30</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {phases.map((phase) => (
              <PhaseCard 
                key={phase.id}
                phaseId={phase.id}
                name={phase.name}
                status={phase.status as PhaseStatus}
                score={phase.score}
                question={phase.question}
                clientId={clientId}
              />
            ))}
          </div>
        </div>

        {/* Bottom Section: Alerts & Systemic Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Alerts Column (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold">Alertas Operacionais</h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">3 Prioridades</span>
            </div>
            
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                 <AlertCard 
                   key={index}
                   title={alert.title}
                   origin={alert.origin}
                   priority={alert.priority as any}
                   linkHref={alert.linkHref}
                 />
              ))}
            </div>
          </div>

          {/* Systemic Health Column (1/3 width) */}
          <div className="lg:col-span-1">
             <SystemicHealthCard />
          </div>

        </div>

      </div>
    </>
  );
}
