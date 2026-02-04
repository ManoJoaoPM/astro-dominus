"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { METRIC_LABELS } from "@/constants/marketing/blocks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- Components ---
const MetricCard = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-muted/20 p-4 rounded-lg">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold">{value.toLocaleString("pt-BR")}</p>
  </div>
);

const BlockRenderer = ({ block, data }: { block: any; data: any[] }) => {
  // Filter data for this block's metrics
  // In a real app, we would sum up values based on date range or show a chart
  // Here we just show total sum for simplicity
  const metrics = block.config.metricsSelected.map((key: string) => {
    const total = data
      .filter((d) => d.metricKey === key)
      .reduce((acc, curr) => acc + curr.value, 0);
    return { key, value: total };
  });

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{block.title || block.templateId}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m: any) => (
            <MetricCard 
              key={m.key} 
              label={METRIC_LABELS[m.key] || m.key} 
              value={m.value} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function PublicReportPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/reports/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        setReportData(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="flex justify-center items-center h-screen">Carregando relatório...</div>;
  if (error || !reportData) return <div className="flex justify-center items-center h-screen">Relatório não encontrado.</div>;

  const { report, blocks, data } = reportData;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{report.name}</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(report.computedDateRange.startDate), "dd/MM/yyyy", { locale: ptBR })} até {format(new Date(report.computedDateRange.endDate), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
            Relatório Público
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {blocks.map((block: any) => (
          <BlockRenderer key={block._id} block={block} data={data} />
        ))}
      </main>
    </div>
  );
}
