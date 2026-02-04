"use client";

import { useState, use } from "react";
import useSWR from "swr";
import { fetcher } from "@discovery-solutions/struct/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  MessageSquare, 
  RefreshCw, 
  Unplug, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  QrCode,
  Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { toast } from "sonner";

export default function WhatsAppsPage({ params: paramsPromise }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(paramsPromise);
  const { data: instances, mutate, isLoading } = useSWR<any>(`/api/whatsapp/instances/refresh?clientId=${clientId}`, fetcher);

  const list = instances?.data || instances || [];

   const handleCreateInstance = async () => {
     try {
      await fetcher("/api/whatsapp/instances", {
        method: "POST",
        body: { clientId },
      });
      mutate();
      toast.success("Solicitação de nova instância enviada.");
    } catch (error: any) {
      toast.error("Erro ao criar instância: " + error.message);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Carregando WhatsApps...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApps</h1>
          <p className="text-muted-foreground">Gerencie as conexões de WhatsApp deste cliente.</p>
        </div>
        <Button onClick={handleCreateInstance}>
          <Plus className="w-4 h-4 mr-2" /> Nova Conexão
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(list) && list.map((instance: any) => (
          <Card key={instance._id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{instance.instanceName}</CardTitle>
                  <CardDescription>{instance.phoneNumber || "Sem número"}</CardDescription>
                </div>
                <StatusBadge status={instance.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Activity className="w-4 h-4 mr-2" />
                  <span>Última atividade: {instance.lastActivityAt ? formatDistanceToNow(new Date(instance.lastActivityAt), { addSuffix: true, locale: ptBR }) : "Nenhuma"}</span>
                </div>
                {instance.status !== "connected" && (
                  <div className="flex items-center text-amber-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Desconectado há {formatDistanceToNow(new Date(instance.updatedAt), { locale: ptBR })}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/clients/${clientId}/whatsapp/inbox/${instance._id}`}>
                    <MessageSquare className="w-4 h-4 mr-2" /> Inbox
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/clients/${clientId}/whatsapp/connect/${instance._id}`}>
                    <QrCode className="w-4 h-4 mr-2" /> Conectar
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!Array.isArray(list) || list.length === 0) && (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
            <Unplug className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum WhatsApp conectado</h3>
            <p className="text-muted-foreground mb-6">Comece conectando o WhatsApp do seu cliente.</p>
            <Button onClick={handleCreateInstance}>
              Conectar Primeiro WhatsApp
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    connected: { label: "Conectado", variant: "default", icon: CheckCircle2, className: "bg-green-500 hover:bg-green-600" },
    connecting: { label: "QR Pendente", variant: "secondary", icon: RefreshCw, className: "animate-spin-slow" },
    disconnected: { label: "Desconectado", variant: "destructive", icon: Unplug },
    error: { label: "Erro", variant: "destructive", icon: AlertCircle },
  };

  const config = configs[status] || configs.disconnected;
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="w-3 h-3 mr-1" /> {config.label}
    </Badge>
  );
}
