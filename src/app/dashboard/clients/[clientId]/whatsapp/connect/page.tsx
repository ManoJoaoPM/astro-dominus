"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { fetcher } from "@discovery-solutions/struct/client";
import useSWR from "swr";
import { toast } from "sonner";
import Image from "next/image";

// Simple polling component for QR Code
export default function WhatsAppConnectPage({ params: paramsPromise }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(paramsPromise);
  
  // Fetch current instance status with active refresh
  const { data: instance, mutate, error } = useSWR<any>(`/api/whatsapp/instances/refresh?clientId=${clientId}`, fetcher, {
    refreshInterval: 10000, // Poll every 10s to check connection status/QR
    onSuccess: (data) => console.log("[Frontend] Polling instance data:", data),
  });

  const [loading, setLoading] = useState(false);

  const handleCreateInstance = async () => {
    try {
      setLoading(true);
      console.log("[Frontend] Requesting create instance...");
      const res = await fetcher("/api/whatsapp/instances", {
        method: "POST",
        body: { clientId },
      });
      console.log("[Frontend] Create instance result:", res);
      mutate();
      toast.success("Instância criada. Aguardando QR Code...");
    } catch (e: any) {
      toast.error("Erro ao criar instância: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      await fetcher(`/api/whatsapp/instances/${id}`, { method: "DELETE" });
      mutate();
      toast.success("Desconectado com sucesso.");
    } catch {
      toast.error("Erro ao desconectar.");
    } finally {
      setLoading(false);
    }
  };

  if (!instance && !error) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // No instance found, show create button
  const list = instance?.data || instance || [];
  if (list.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card>
          <CardHeader>
            <CardTitle>Conectar WhatsApp</CardTitle>
            <CardDescription>
              Conecte o WhatsApp do cliente para monitorar conversas e gerar inteligência.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateInstance} disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
              Gerar QR Code de Conexão
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentInstance = list[0]; // Handle array or object return
  console.log(currentInstance)

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status da Conexão</CardTitle>
            {currentInstance.status === "connected" ? (
              <span className="flex items-center text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full text-sm">
                <CheckCircle className="w-4 h-4 mr-2" /> Conectado
              </span>
            ) : (
              <span className="flex items-center text-amber-600 font-medium bg-amber-100 px-3 py-1 rounded-full text-sm">
                <AlertCircle className="w-4 h-4 mr-2" /> {currentInstance.status === "connecting" ? "Aguardando Leitura" : "Desconectado"}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {currentInstance.status === "connected" ? (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle size={48} />
              </div>
              <p className="text-muted-foreground">O WhatsApp está monitorando conversas ativamente.</p>
              <Button variant="outline" onClick={() => handleDisconnect(currentInstance._id)} className="text-destructive hover:bg-destructive/10">
                Desconectar
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4 w-full">
              {currentInstance.qrCode ? (
                <div className="bg-white p-4 rounded-xl border inline-block">
                  {/* Render Base64 Image */}
                  <img 
                    src={currentInstance.qrCode.startsWith("data:") ? currentInstance.qrCode : `data:image/png;base64,${currentInstance.qrCode}`} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64"
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="animate-spin mr-2" /> Gerando QR Code...
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Abra o WhatsApp no celular, vá em <strong>Aparelhos Conectados &gt; Conectar Aparelho</strong> e escaneie o código acima.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
