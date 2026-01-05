"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target } from "lucide-react";
import { Checklist, ChecklistItem } from "@/components/dashboard/roadmap/checklist";
import { KpiGrid } from "@/components/dashboard/roadmap/kpi-grid";
import { Diagnosis } from "@/components/dashboard/roadmap/diagnosis";
import { Timeline } from "@/components/dashboard/roadmap/timeline";
import { cn } from "@/lib/utils";

const PHASE_DATA: Record<string, any> = {
  spy: {
    id: "spy",
    name: "Spy",
    question: "Estamos medindo corretamente?",
    status: "atencao",
    score: 65,
    meta: 100,
    exitCriteria: "Jornada do lead rastreada e registrada no CRM.",
    checklist: [
      { id: "c1", label: "Tracking completo (GTM/UTM/GA4)", status: "success", meta: "Configurado", definition: "Verificar se todas as tags estão disparando.", action: "Nenhuma ação necessária." },
      { id: "c2", label: "Funil mapeado no CRM", status: "success", meta: "Mapeado", definition: "Etapas do funil correspondem à jornada.", action: "Nenhuma ação necessária." },
      { id: "c3", label: "CRM conectado ao dashboard", status: "warning", meta: "Campos divergentes", definition: "Integração via API.", action: "Verificar mapeamento de campos de origem." },
      { id: "c4", label: "Tempo de resposta medido", status: "error", meta: "Sem dados", definition: "Medição do tempo entre lead e primeiro contato.", action: "Implementar automação de timestamp." }
    ],
    kpis: [
      { label: "% Eventos Rastreados", value: "92%", trend: 5 },
      { label: "Leads Atribuídos", value: "145", trend: 12 },
      { label: "Tempo Médio Resp.", value: "—", trend: 0 }
    ],
    diagnosis: { status: "Atenção Necessária", text: "O tracking de conversão está bom, mas a integração com CRM apresenta falhas que impactam a atribuição de origem. Priorize a correção dos campos do CRM." },
    timeline: [
       { date: "02/01", description: "Tracking GTM corrigido." },
       { date: "28/12", description: "Início da auditoria de tracking." }
    ]
  },
  pickup: {
    id: "pickup",
    name: "Pick Up",
    question: "A geração de leads está saudável?",
    status: "saudavel",
    score: 88,
    meta: 80,
    exitCriteria: "Primeira conversão validada e saudável.",
    checklist: [
      { id: "c1", label: "CTR Search > 15%", status: "success", meta: "Meta: >15% • Atual: 18.5%", definition: "Taxa de cliques nos anúncios de pesquisa.", action: "Manter criativos atuais." },
      { id: "c2", label: "CPC dentro do esperado", status: "success", meta: "Dentro da meta", definition: "Custo por clique.", action: "Monitorar leilão." },
      { id: "c3", label: "Connect Rate ≥ 85%", status: "warning", meta: "Meta: ≥ 85% • Atual: 82%", definition: "Taxa de leads que atendem o telefone.", action: "Revisar script de abordagem inicial e horários." }
    ],
    kpis: [
      { label: "CTR Médio", value: "18.5%", trend: 2.3 },
      { label: "CPC Médio", value: "R$ 4,50", trend: 5 },
      { label: "Engajamento", value: "+12%", trend: 12 }
    ],
    diagnosis: { status: "Fase Saudável", text: "Todas as métricas principais estão dentro do esperado. Continue monitorando o volume de leads e foque em otimizar o Connect Rate." },
    timeline: [
      { date: "02/01", description: "Novos criativos subiram CTR" }
    ]
  },
  generate: {
    id: "generate",
    name: "Generate Lead",
    question: "A geração de leads supre o esperado?",
    status: "saudavel",
    score: 92,
    meta: 80,
    exitCriteria: "Leads previsíveis e dentro do padrão.",
    checklist: [
      { id: "c1", label: "Conversão do site ≥ 2%", status: "success", meta: "Atual: 2.4%", definition: "Visitantes que viram leads.", action: "Manter CRO." },
      { id: "c2", label: "% MQL ≥ 40%", status: "success", meta: "Atual: 42%", definition: "Leads qualificados pelo marketing.", action: "Nenhuma." },
      { id: "c3", label: "Volume de leads atende necessidade", status: "success", meta: "Sim", definition: "Quantidade absoluta de leads.", action: "Avaliar aumento de budget para escala." }
    ],
    kpis: [
      { label: "Taxa Conv. Site", value: "2.4%", trend: 0.5 },
      { label: "% MQL", value: "42%", trend: 2 },
      { label: "Custo/Lead", value: "R$ 35", trend: -5 }
    ],
    diagnosis: { status: "Alta Performance", text: "A geração de leads está excelente, com volume e qualidade acima da meta. Momento ideal para planejar escala." },
    timeline: [
      { date: "05/01", description: "Recorde de leads diários batido." }
    ]
  },
  booking: {
    id: "booking",
    name: "Booking",
    question: "O cliente consegue agendar visitas?",
    status: "critico",
    score: 42,
    meta: 80,
    exitCriteria: "Cliente extrai o potencial total do marketing.",
    checklist: [
      { id: "c1", label: "Resposta: pré-atendimento ≤ 5 min", status: "error", meta: "Atual: 18 min", definition: "Tempo para primeiro contato.", action: "Contratar SDR ou automatizar primeiro oi." },
      { id: "c2", label: "Resposta: corretor ≤ 20 min", status: "warning", meta: "Atual: 45 min", definition: "Tempo para corretor assumir.", action: "Treinamento e cobrança." },
      { id: "c3", label: "Follow-ups estruturados", status: "error", meta: "Não realizados", definition: "Cadência de contato (7 em 15 dias).", action: "Implementar playbook de vendas." }
    ],
    kpis: [
      { label: "Tempo Resp.", value: "18min", trend: -15 },
      { label: "Taxa Agendamento", value: "5%", trend: -2 },
      { label: "Show Rate", value: "40%", trend: 0 }
    ],
    diagnosis: { status: "Gargalo Crítico", text: "O tempo de resposta alto está matando a conversão de leads em visitas. Ações urgentes no comercial são necessárias." },
    timeline: [
      { date: "03/01", description: "Alerta de tempo de resposta disparado." }
    ]
  },
  escala: {
    id: "escala",
    name: "Escala",
    question: "O sistema se paga?",
    status: "sem_dados",
    score: 0,
    meta: 80,
    exitCriteria: "Escala previsível e sustentável.",
    checklist: [
      { id: "c1", label: "CAC por venda mensurável", status: "warning", meta: "Sem dados de venda", definition: "Custo de Aquisição de Cliente.", action: "Integrar dados de fechamento." },
      { id: "c2", label: "ROI por canal", status: "warning", meta: "Parcial", definition: "Retorno sobre investimento.", action: "Aguardar dados de vendas." }
    ],
    kpis: [
      { label: "CAC", value: "—", trend: 0 },
      { label: "ROI", value: "—", trend: 0 },
      { label: "LTV", value: "—", trend: 0 }
    ],
    diagnosis: { status: "Aguardando Dados", text: "Ainda não temos dados suficientes de vendas para calcular a eficiência financeira da escala." },
    timeline: []
  }
};

export default function PhaseDetailPage() {
  const { clientId, phase } = useParams() as { clientId: string, phase: string };
  const data = PHASE_DATA[phase] || PHASE_DATA['spy']; // Fallback to spy

  const statusColor = 
    data.status === 'saudavel' ? 'text-emerald-600 bg-emerald-100' :
    data.status === 'atencao' ? 'text-amber-600 bg-amber-100' :
    data.status === 'critico' ? 'text-red-600 bg-red-100' :
    'text-gray-600 bg-gray-100';

  const statusLabel = 
    data.status === 'saudavel' ? 'Saudável' :
    data.status === 'atencao' ? 'Atenção' :
    data.status === 'critico' ? 'Crítico' :
    'Sem dados';

  return (
    <>
       <SiteHeader
        heading={[
          { link: "/dashboard/clients", label: "Clientes" },
          { link: `/dashboard/clients/${clientId}`, label: "Cliente" }, // Should fetch name ideally
          { link: `/dashboard/clients/${clientId}/roadmap`, label: "Roadmap" },
          { link: "#", label: `Fase ${data.id === 'spy' ? '1' : data.id === 'pickup' ? '2' : data.id === 'generate' ? '3' : data.id === 'booking' ? '4' : '5'} — ${data.name}` },
        ]}
      />
      
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* Top Navigation & Header */}
        <div className="flex flex-col gap-4">
           <Link href={`/dashboard/clients/${clientId}/roadmap`} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
             <ArrowLeft className="w-4 h-4 mr-1" />
             Voltar ao Dashboard
           </Link>

           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border rounded-xl p-6">
              <div className="space-y-1">
                 <div className="flex items-center gap-3">
                   <h1 className="text-2xl font-bold">Fase {data.id === 'spy' ? '1' : data.id === 'pickup' ? '2' : data.id === 'generate' ? '3' : data.id === 'booking' ? '4' : '5'} — {data.name}</h1>
                   <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase", statusColor)}>
                     {statusLabel}
                   </span>
                 </div>
                 <p className="text-muted-foreground">{data.question}</p>
              </div>

              {/* Score Box */}
              <div className="flex items-center gap-6 border-l pl-6">
                 <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Score da Fase</p>
                    <p className="text-4xl font-bold">{data.score}</p>
                 </div>
                 <div className="w-32 space-y-1">
                    <div className="flex justify-between text-xs">
                       <span>Meta</span>
                       <span className="font-bold">{data.meta}</span>
                    </div>
                    {/* Simple Progress Bar */}
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-orange-500 rounded-full" style={{ width: `${data.score}%` }} />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Column: Checklist & Diagnosis */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Checklist Section */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Target className="w-5 h-5 text-primary" />
                       <h2 className="text-lg font-semibold">Checklist de Requisitos</h2>
                    </div>
                    <span className="text-sm text-muted-foreground">
                       {data.checklist.filter((i: any) => i.status === 'success').length}/{data.checklist.length} concluídos
                    </span>
                 </div>
                 <Checklist items={data.checklist} />
              </div>

              {/* Diagnosis Section */}
              <div className="space-y-4">
                 <h2 className="text-lg font-semibold">Diagnóstico & Ações</h2>
                 <Diagnosis status={data.diagnosis.status} text={data.diagnosis.text} />
              </div>

           </div>

           {/* Right Column: Exit Criteria, KPIs, Timeline */}
           <div className="space-y-6">
              
              {/* Exit Criteria */}
              <div className="bg-orange-500 text-white rounded-xl p-6 shadow-lg">
                 <div className="flex items-center gap-2 mb-2 opacity-90">
                    <Target className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Critério de Saída</span>
                 </div>
                 <p className="text-lg font-medium leading-tight">
                    "{data.exitCriteria}"
                 </p>
              </div>

              {/* KPIs */}
              <div className="space-y-4">
                 <h2 className="text-lg font-semibold">Métricas Chave (KPIs)</h2>
                 <div className="grid grid-cols-1 gap-3">
                   {data.kpis.map((kpi: any, idx: number) => (
                      <div key={idx} className="bg-card border rounded-lg p-4 flex justify-between items-center shadow-sm">
                         <div>
                            <p className="text-sm text-muted-foreground">{kpi.label}</p>
                            <p className="text-xl font-bold">{kpi.value}</p>
                         </div>
                         <div className={cn("text-xs font-medium px-2 py-1 rounded-full", kpi.trend >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                            {kpi.trend >= 0 ? "+" : ""}{kpi.trend}%
                         </div>
                      </div>
                   ))}
                 </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                 <h2 className="text-lg font-semibold">Histórico da Fase</h2>
                 <Timeline events={data.timeline} />
              </div>

           </div>
        </div>

      </div>
    </>
  )
}
