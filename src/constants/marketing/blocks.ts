export interface BlockTemplate {
  id: string;
  category: "Social Media" | "Tráfego Pago" | "Roadmap" | "Atendimento";
  title: string;
  objective: string;
  supportedMetrics: string[]; // keys corresponding to MetricSnapshot metricKeys
  defaultConfig: {
    metricsSelected: string[];
    filters?: Record<string, any>;
  };
}

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  // --- Social Media ---
  {
    id: "SM-01",
    category: "Social Media",
    title: "Visão Geral Social Media",
    objective: "Apresentar o crescimento de seguidores e alcance geral.",
    supportedMetrics: ["followers_count", "reach", "impressions", "profile_views"],
    defaultConfig: {
      metricsSelected: ["followers_count", "reach"],
    },
  },
  {
    id: "SM-02",
    category: "Social Media",
    title: "Performance de Conteúdos",
    objective: "Análise de engajamento e interação.",
    supportedMetrics: ["likes", "comments", "shares", "saves", "engagement_rate"],
    defaultConfig: {
      metricsSelected: ["engagement_rate", "likes", "comments"],
    },
  },

  // --- Tráfego Pago ---
  {
    id: "TP-01",
    category: "Tráfego Pago",
    title: "Visão Geral Tráfego Pago",
    objective: "Resumo de investimento e resultados principais.",
    supportedMetrics: ["spend", "impressions", "clicks", "ctr", "cpc", "leads", "cpl"],
    defaultConfig: {
      metricsSelected: ["spend", "clicks", "ctr", "cpc"],
    },
  },
  {
    id: "TP-02",
    category: "Tráfego Pago",
    title: "Campanhas Ativas",
    objective: "Detalhamento por campanha.",
    supportedMetrics: ["spend", "impressions", "clicks", "leads"],
    defaultConfig: {
      metricsSelected: ["spend", "leads"],
    },
  },

  // --- Roadmap ---
  {
    id: "RM-01",
    category: "Roadmap",
    title: "Status Geral do Roadmap",
    objective: "Acompanhamento macro das entregas.",
    supportedMetrics: ["tasks_completed", "tasks_pending", "progress_percentage"],
    defaultConfig: {
      metricsSelected: ["progress_percentage"],
    },
  },

  // --- Atendimento ---
  {
    id: "AT-01",
    category: "Atendimento",
    title: "Tempo de Atendimento",
    objective: "Monitoramento de SLA.",
    supportedMetrics: ["avg_response_time", "tickets_solved", "tickets_open"],
    defaultConfig: {
      metricsSelected: ["avg_response_time", "tickets_solved"],
    },
  },
];

export const METRIC_LABELS: Record<string, string> = {
  followers_count: "Seguidores",
  reach: "Alcance",
  impressions: "Impressões",
  profile_views: "Visitas ao Perfil",
  likes: "Curtidas",
  comments: "Comentários",
  shares: "Compartilhamentos",
  saves: "Salvamentos",
  engagement_rate: "Taxa de Engajamento",
  spend: "Investimento",
  clicks: "Cliques",
  ctr: "CTR (%)",
  cpc: "CPC Médio",
  leads: "Leads",
  cpl: "Custo por Lead",
  tasks_completed: "Tarefas Concluídas",
  tasks_pending: "Tarefas Pendentes",
  progress_percentage: "Progresso (%)",
  avg_response_time: "Tempo Médio de Resposta",
  tickets_solved: "Tickets Resolvidos",
  tickets_open: "Tickets Abertos",
};
