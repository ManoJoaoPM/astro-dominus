"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@discovery-solutions/struct";
import { SiteHeader } from "@/components/site-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconExternalLink,
  IconUserCheck,
  IconUserX,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface Lead {
  _id: string;
  name: string;
  email: string;
  instagram?: string | null;
  website?: string | null;
  potentialService?: string | null;
}

export default function LeadQualificationPage() {
  const queryClient = useQueryClient();

  // 1) Buscar só leads com qualificationStatus = pending
  const { data, isLoading } = useQuery<Lead[]>({
    queryKey: ["leads-qualification"],
    queryFn: () =>
      fetcher("/api/commercial/lead?qualificationStatus=pending") as Promise<Lead[]>,
  });

  // 2) Mutation para QUALIFICAR / NÃO QUALIFICAR
  const mutation = useMutation({
    mutationFn: async ({
      id,
      status,
      potentialService,
    }: {
      id: string;
      status: "qualified" | "unqualified";
      potentialService?: string;
    }) => {
      console.log("[MUTATION] Enviando PATCH", { id, status, potentialService });

      // return fetcher(`/api/commercial/lead/${id}`, {
      //   method: "PATCH",
      //   body: JSON.stringify({
      //     qualificationStatus: status,
      //     potentialService,
      //   }),
      // });

      toast.success(`Lead ${status === "qualified" ? "qualificado" : "não qualificado"} com sucesso!`);

      // Usando fetch nativo para evitar problemas com fetcher do struct se houver
      const response = await fetch(`/api/commercial/lead/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qualificationStatus: status,
          potentialService,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar lead");
      }


      return response.json();
    },
    onSuccess: (res) => {
      console.log("[MUTATION] Sucesso:", res);
      queryClient.invalidateQueries({ queryKey: ["leads-qualification"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      console.error("[MUTATION] Erro ao qualificar lead:", error);
      // aqui você pode plugar um toast, ex:
      // toast.error("Erro ao qualificar lead");
    },
  });

  return (
    <div className="w-full">
      <SiteHeader
        heading={[
          { link: "/dashboard/leads", label: "Leads" },
          { link: "/dashboard/leads/qualification", label: "Qualificação de Leads" },
        ]}
      />

      <div className="px-4 py-4 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && <div>Carregando leads pendentes...</div>}

        {!isLoading && (!data || data.length === 0) && (
          <div className="col-span-full text-sm text-muted-foreground">
            Nenhum lead pendente de qualificação.
          </div>
        )}

        {data?.map((lead) => (
          <LeadCard
            key={lead._id}
            lead={lead}
            onQualify={(status, potentialService) =>
              mutation.mutate({ id: lead._id, status, potentialService })
            }
            isProcessing={mutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  onQualify,
  isProcessing,
}: {
  lead: Lead;
  onQualify: (status: "qualified" | "unqualified", potentialService?: string) => void;
  isProcessing: boolean;
}) {
  const [potentialService, setPotentialService] = React.useState(
    lead.potentialService ?? ""
  );

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {lead.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground break-all">
          {lead.email}
        </p>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {/* LINKS LADO A LADO */}
        <div className="grid grid-cols-2 gap-2">
          {lead.instagram && lead.instagram !== "Não encontrado" && (
            <a
              href={lead.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-2 rounded-md border hover:bg-muted transition-colors text-xs font-medium"
            >
              <IconExternalLink className="size-4 text-primary" />
              Instagram
            </a>
          )}

          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-2 rounded-md border hover:bg-muted transition-colors text-xs font-medium"
            >
              <IconExternalLink className="size-4 text-primary" />
              Site
            </a>
          )}
        </div>

        {/* POTENCIAL SERVIÇO */}
        <div className="space-y-1 pt-2">
          <span className="text-xs font-medium text-muted-foreground">
            Potencial serviço
          </span>
          <Input
            value={potentialService}
            onChange={(e) => setPotentialService(e.target.value)}
            placeholder="Ex: Tráfego pago, site, funil..."
            className="h-8 text-xs"
          />
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex gap-2 justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={isProcessing}
          onClick={() => {
            console.log("[CLICK] Não qualificado", {
              id: lead._id,
              potentialService,
            });
            onQualify("unqualified", potentialService || undefined);
          }}
          className="flex-1 flex items-center gap-1 text-xs"
        >
          <IconUserX className="size-4" />
          Não qualificado
        </Button>

        <Button
          size="sm"
          disabled={isProcessing}
          onClick={() => {
            console.log("[CLICK] Qualificado", {
              id: lead._id,
              potentialService,
            });
            onQualify("qualified", potentialService || undefined);
          }}
          className="flex-1 flex items-center gap-1 text-xs"
        >
          <IconUserCheck className="size-4" />
          Qualificado
        </Button>
      </CardFooter>
    </Card>
  );
}
