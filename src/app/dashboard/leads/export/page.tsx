"use client";

import { useState } from "react";
import useSWR from "swr";
import { SiteHeader } from "@/components/site-header";
import { fetcher } from "@discovery-solutions/struct";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle2, AlertCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
}

export default function ExportPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch only qualified leads
  const { data: leads, isLoading } = useSWR<Lead[]>(
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

  const handleExport = async () => {
    if (selectedIds.length === 0) return;

    setIsExporting(true);
    try {
      const res = await fetcher("/api/commercial/export/pipedrive", {
        method: "POST",
        body: { leadIds: selectedIds },
      });

      const successCount = res.results.filter((r: any) => r.status === "success").length;
      const duplicateCount = res.results.filter((r: any) => r.status === "duplicate").length;
      const failedCount = res.results.filter((r: any) => r.status === "failed" || r.status === "error").length;

      if (successCount > 0) toast.success(`${successCount} leads exportados com sucesso!`);
      if (duplicateCount > 0) toast.info(`${duplicateCount} leads já existiam no Pipedrive.`);
      if (failedCount > 0) toast.error(`${failedCount} falharam.`);

      setSelectedIds([]);
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

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exportação de Leads</h1>
            <p className="text-muted-foreground">
              Envie seus leads qualificados para o Pipedrive.
            </p>
          </div>
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
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground">
                         <span>{lead.email || "Sem email"}</span>
                         <span>{lead.phone || "Sem telefone"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{lead.city || "-"}</TableCell>
                    <TableCell>
                      {/* Placeholder logic for visual check */}
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertCircle className="w-3 h-3" />
                        Não verificado
                      </span>
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
