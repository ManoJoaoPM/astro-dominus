"use client";

import { useState } from "react";
import useSWR from "swr";
import { SiteHeader } from "@/components/site-header";
import { fetcher } from "@discovery-solutions/struct";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, AlertCircle, Share2, ExternalLink, RefreshCw, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  pipedriveUrl: string;
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  pipedriveId?: number;
  exportedAt?: string;
}

export default function ExportPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  // Advanced Config State
  const [batchSize, setBatchSize] = useState(15);
  const [createDeal, setCreateDeal] = useState(true);
  const [createActivity, setCreateActivity] = useState(true);
  const [activitySubject, setActivitySubject] = useState("Enviar Primeiro Toque");
  const [limitQuantity, setLimitQuantity] = useState<number | "">(75);

  // Fetch only qualified leads
  const { data: leads, isLoading, mutate } = useSWR<Lead[]>(
    "/api/lead?qualificationStatus=qualified",
    fetcher
  );

  const toggleSelectAll = () => {
    if (!leads) return;
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSync = async () => {
    setIsExporting(true); // Reusing state for loader
    try {
        const res = await fetcher("/api/commercial/sync/pipedrive", {
            method: "POST",
        });
        toast.success(`Sincronização concluída! ${res.totalPipedrive} leads processados. (${res.created} criados, ${res.updated} atualizados)`);
        mutate();
    } catch (error) {
        toast.error("Erro ao sincronizar com Pipedrive.");
        console.error(error);
    } finally {
        setIsExporting(false);
    }
  };

  const selectRandomLeads = (quantity: number) => {
      if (!leads) return;
      // Filter out already exported?
      // User might want to re-export or export new ones.
      // Usually "Export 48 leads" means "Export 48 NEW leads".
      const pendingLeads = leads.filter(l => !l.pipedriveId);
      const toSelect = pendingLeads.slice(0, quantity).map(l => l._id);
      setSelectedIds(toSelect);
      
      if (toSelect.length < quantity) {
          toast.info(`Apenas ${toSelect.length} leads pendentes disponíveis para seleção.`);
      } else {
          toast.success(`${toSelect.length} leads selecionados automaticamente.`);
      }
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) return;

    setIsExporting(true);
    setShowConfig(false); // Close modal if open

    try {
      const res = await fetcher("/api/commercial/export/pipedrive", {
        method: "POST",
        body: { 
            leadIds: selectedIds,
            config: {
                batchSize: Number(batchSize),
                createDeal,
                createActivity,
                activitySubject
            }
        },
      });

      const successCount = res.results.filter((r: any) => r.status === "success").length;
      const duplicateCount = res.results.filter((r: any) => r.status === "duplicate").length;
      const failedCount = res.results.filter((r: any) => r.status === "failed" || r.status === "error").length;

      if (successCount > 0) toast.success(`${successCount} leads exportados com sucesso!`);
      if (duplicateCount > 0) toast.info(`${duplicateCount} leads já existiam no Pipedrive.`);
      if (failedCount > 0) toast.error(`${failedCount} falharam.`);

      setSelectedIds([]);
      mutate();
    } catch (error) {
      toast.error("Erro ao exportar leads.");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full">
      <SiteHeader
        heading={[
          { link: "/dashboard/leads", label: "Leads" },
          { link: "/dashboard/leads/export", label: "Exportar Pipedrive" },
        ]}
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold">Exportação de Leads</h1>
                <p className="text-muted-foreground">
                Envie seus leads qualificados para o Pipedrive.
                </p>
            </div>
            
            <Dialog open={showConfig} onOpenChange={setShowConfig}>
                <DialogTrigger asChild>
                    <Button variant="secondary">
                        <Settings2 className="mr-2 h-4 w-4" />
                        Configurar Exportação Avançada
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Exportação Automática (Cadência)</DialogTitle>
                        <DialogDescription>
                            Configure a distribuição das atividades de primeiro toque.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Quantidade de Leads</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="number" 
                                        value={limitQuantity} 
                                        onChange={(e) => setLimitQuantity(Number(e.target.value))}
                                    />
                                    <Button size="sm" onClick={() => selectRandomLeads(Number(limitQuantity))}>
                                        Selecionar
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Seleciona leads pendentes da lista.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Lote Diário (Leads/Dia)</Label>
                                <Input 
                                    type="number" 
                                    value={batchSize} 
                                    onChange={(e) => setBatchSize(Number(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">Atividades distribuídas em dias úteis.</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 border p-3 rounded-md">
                            <Checkbox 
                                id="createDeal" 
                                checked={createDeal}
                                onCheckedChange={(c) => setCreateDeal(!!c)}
                            />
                            <Label htmlFor="createDeal" className="cursor-pointer">Criar Negócio Automaticamente</Label>
                        </div>

                        {createDeal && (
                            <div className="pl-6 space-y-3 border-l-2 ml-1">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="createActivity" 
                                        checked={createActivity}
                                        onCheckedChange={(c) => setCreateActivity(!!c)}
                                    />
                                    <Label htmlFor="createActivity" className="cursor-pointer">Agendar Atividade de 1º Toque</Label>
                                </div>
                                
                                {createActivity && (
                                    <div className="space-y-2">
                                        <Label>Assunto da Atividade</Label>
                                        <Input 
                                            value={activitySubject} 
                                            onChange={(e) => setActivitySubject(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={handleExport} disabled={selectedIds.length === 0 || isExporting}>
                            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Exportar {selectedIds.length} Leads Agora
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-2">
            <Button
                variant="outline"
                onClick={handleSync}
                disabled={isExporting}
            >
                <RefreshCw className={`mr-2 h-4 w-4 ${isExporting ? "animate-spin" : ""}`} />
                Sincronizar Pipedrive
            </Button>
            
            <div className="flex-1"></div>

            <Button 
                onClick={handleExport} 
                disabled={isExporting || selectedIds.length === 0}
                className="bg-green-600 hover:bg-green-700"
            >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="mr-2 h-4 w-4" />
            )}
            Exportar Selecionados ({selectedIds.length})
          </Button>
        </div>
        </div>

        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={leads && leads.length > 0 && selectedIds.length === leads.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Status Pipedrive</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Carregando leads qualificados...
                  </TableCell>
                </TableRow>
              ) : !leads || leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum lead qualificado para exportação.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead._id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(lead._id)}
                        onCheckedChange={() => toggleSelect(lead._id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {lead.pipedriveUrl ? (
                        <a 
                          href={lead.pipedriveUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:underline text-blue-600"
                        >
                          {lead.name}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        lead.name
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground">
                         <span>{lead.email || "Sem email"}</span>
                         <span>{lead.phone || "Sem telefone"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{lead.city || "-"}</TableCell>
                    <TableCell>
                      {lead.pipedriveId ? (
                        <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Exportado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <AlertCircle className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
