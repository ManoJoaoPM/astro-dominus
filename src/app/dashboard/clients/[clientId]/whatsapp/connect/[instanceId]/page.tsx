"use client";

import { useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, CheckCircle, AlertCircle, ArrowLeft, Terminal } from "lucide-react";
import { fetcher } from "@discovery-solutions/struct/client";
import useSWR from "swr";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function WhatsAppConnectPage({ params: paramsPromise }: { params: Promise<{ clientId: string; instanceId: string }> }) {
  const { clientId, instanceId } = use(paramsPromise);
  
  // Fetch current instance status with active refresh
  const { data: instance, mutate } = useSWR<any>(`/api/whatsapp/instances/${instanceId}`, fetcher, {
    refreshInterval: 5000, // Poll every 5s for QR/Status
  });

  const [loading, setLoading] = useState(false);

  const handleReconnect = async () => {
    try {
      setLoading(true);
      await fetcher(`/api/whatsapp/instances/${instanceId}/reconnect`, { method: "POST" });
      mutate();
      toast.success("Solicitação de reconexão enviada.");
    } catch (e: any) {
      toast.error("Erro ao reconectar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await fetcher(`/api/whatsapp/instances/${instanceId}`, { method: "DELETE" });
      mutate();
      toast.success("Instância removida.");
    } catch {
      toast.error("Erro ao desconectar.");
    } finally {
      setLoading(false);
    }
  };

  if (!instance) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/clients/${clientId}/whatsapp`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Gerenciar Conexão</h1>
      </div>

      <Tabs defaultValue="connection">
        <TabsList>
          <TabsTrigger value="connection">Conexão</TabsTrigger>
          <TabsTrigger value="logs">Logs de Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Status: {instance.instanceName}</CardTitle>
                  <CardDescription>
                    {instance.phoneNumber || "Aguardando conexão..."}
                  </CardDescription>
                </div>
                <StatusIndicator status={instance.status} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-10">
              {instance.status === "connected" ? (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                    <CheckCircle size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">WhatsApp Conectado</h3>
                    <p className="text-muted-foreground">O sistema está recebendo mensagens em tempo real.</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={handleReconnect} disabled={loading}>
                      Forçar Reconexão
                    </Button>
                    <Button variant="destructive" onClick={handleDisconnect} disabled={loading}>
                      Remover Instância
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6 w-full max-w-sm">
                  {instance.qrCode ? (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border-4 border-slate-100 inline-block">
                        <img 
                          src={instance.qrCode.startsWith("data:") ? instance.qrCode : `data:image/png;base64,${instance.qrCode}`} 
                          alt="QR Code WhatsApp" 
                          className="w-64 h-64"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Escaneie o QR Code no seu WhatsApp (Aparelhos Conectados)
                      </p>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4">
                      <Loader2 className="animate-spin w-10 h-10" />
                      <p>Gerando novo QR Code...</p>
                      <Button variant="outline" onClick={handleReconnect} size="sm">
                        Tentar Novamente
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" /> Logs da Instância
              </CardTitle>
              <CardDescription>Histórico de eventos de conexão e erros.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-2 max-h-[400px] overflow-y-auto">
                {instance.logs?.length > 0 ? (
                  instance.logs.reverse().map((log: any, i: number) => (
                    <div key={i} className="border-b border-slate-800 pb-2 last:border-0">
                      <span className="text-slate-500">[{format(new Date(log.timestamp), "HH:mm:ss")}]</span>{" "}
                      <span className="text-blue-400">{log.event}</span>:{" "}
                      <span>{JSON.stringify(log.details || "Nenhum detalhe")}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-600 italic">Nenhum log registrado.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusIndicator({ status }: { status: string }) {
  if (status === "connected") {
    return (
      <span className="flex items-center text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full text-xs border border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" /> Conectado
      </span>
    );
  }
  return (
    <span className="flex items-center text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-full text-xs border border-amber-200">
      <AlertCircle className="w-3 h-3 mr-1" /> {status === "connecting" ? "QR Pendente" : "Desconectado"}
    </span>
  );
}
