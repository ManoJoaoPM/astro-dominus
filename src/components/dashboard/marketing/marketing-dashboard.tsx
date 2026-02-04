"use client";

import { useState } from "react";
import useSWR from "swr";
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { MarketingIntegrationInterface } from "@/models/marketing/integration";
import type { MarketingDailyFactInterface } from "@/models/marketing/daily-fact";
import { ConnectMetaModal } from "./connect-modal";

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    const json = await r.json();

    // Se já vier no padrão { data }, mantém
    if (json && typeof json === "object" && "data" in json) return json;

    // Se vier array (padrão Struct), embrulha
    if (Array.isArray(json)) return { data: json };

    // Se vier entity única, embrulha como array pra manter consistência
    if (json) return { data: [json] };

    return { data: [] };
  });

interface DashboardData {
  summary: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
  };
  series: Array<{
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
  }>;
  integration: {
    name: string;
    lastSync: string | Date | null;
  };
}

export default function MarketingDashboard({ clientId }: { clientId: string }) {
  const [period, setPeriod] = useState("last_30d");
  const [syncing, setSyncing] = useState(false);

  // 1. Fetch Integration
  const { data: integrations, isLoading: loadingInt, mutate: mutateInt } = useSWR<{ data: MarketingIntegrationInterface[] }>(
    `/api/marketing/integration?clientId=${clientId}&provider=meta`,
    fetcher
  );

  const integration = integrations?.data?.[0];

  // 2. Determine date range
  const today = new Date();
  const getStartDate = () => {
    switch (period) {
      case "today": return today;
      case "last_3d": return subDays(today, 3);
      case "last_7d": return subDays(today, 7);
      case "last_30d": return subDays(today, 30);
      default: return subDays(today, 30);
    }
  };
  
  const startDate = getStartDate();
  // Ensure we use a stable date string (YYYY-MM-DD) to prevent infinite re-fetching
  // If we include time, useSWR key changes every millisecond on re-render
  const startDateStr = format(startDate, "yyyy-MM-dd");

  // 3. Fetch Facts (if integration exists)
  const { data: factsData, isLoading: loadingFacts, mutate: mutateFacts } = useSWR<{ data: MarketingDailyFactInterface[] }>(
    integration?._id
      ? `/api/marketing/daily-fact?integrationId=${integration._id}&date[gte]=${startDateStr}`
      : null,
    fetcher
  );

  const handleSync = async () => {
    if (!integration?._id) return;
    try {
      setSyncing(true);
      const res = await fetch("/api/marketing/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: integration._id }),
      });
      if (!res.ok) throw new Error("Sync failed");
      toast.success("Dados atualizados com sucesso!");
      mutateInt();
      mutateFacts();
    } catch (e) {
      toast.error("Erro ao sincronizar dados.");
    } finally {
      setSyncing(false);
    }
  };

  if (loadingInt) return <div className="p-10 text-center">Carregando dados de marketing...</div>;

  if (!integration) {
    return (
      <div className="flex flex-col items-center justify-center p-10 space-y-4 border rounded-xl bg-card">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Nenhuma conta conectada</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Conecte uma conta de anúncios do Meta Ads para visualizar os dados de performance deste cliente.
          </p>
        </div>
        <ConnectMetaModal clientId={clientId} onSuccess={() => mutateInt()} />
      </div>
    );
  }

  if (loadingFacts) return <div className="p-10 text-center">Carregando métricas...</div>;
  
  // 4. Client-side Aggregation (Simplified since we now sync daily account totals)
  const facts = factsData?.data || [];

  // Sort by date
  const series = facts
    .map(f => ({
      date: f.date.toString().split("T")[0],
      spend: f.spend || 0,
      impressions: f.impressions || 0,
      clicks: f.clicks || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Summary totals
  const totalSpend = facts.reduce((acc, f) => acc + (f.spend || 0), 0);
  const totalImpressions = facts.reduce((acc, f) => acc + (f.impressions || 0), 0);
  const totalClicks = facts.reduce((acc, f) => acc + (f.clicks || 0), 0);
  
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

  const summary = {
    spend: totalSpend,
    impressions: totalImpressions,
    clicks: totalClicks,
    ctr: avgCtr,
    cpc: avgCpc,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Performance de Mídia</h2>
          <p className="text-sm text-muted-foreground">
            Dados sincronizados de {integration.name} • Última atualização: {integration.lastSyncAt ? format(new Date(integration.lastSyncAt), "dd/MM/yyyy HH:mm") : "Nunca"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7d">Últimos 7 dias</SelectItem>
              <SelectItem value="last_30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary.spend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.impressions.toLocaleString("pt-BR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.clicks.toLocaleString("pt-BR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.ctr.toFixed(2)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPC Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary.cpc.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução Diária</CardTitle>
          <CardDescription>Investimento x Resultados no período selecionado.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(str) => {
                    try {
                      return format(parseISO(str), "dd/MM", { locale: ptBR })
                    } catch { return str }
                  }}
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  labelFormatter={(str) => {
                    try {
                      return format(parseISO(str), "dd 'de' MMMM", { locale: ptBR })
                    } catch { return str }
                  }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Investimento"]}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Area 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorSpend)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
