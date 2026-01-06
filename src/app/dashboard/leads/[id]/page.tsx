"use client";

import * as React from "react";
import useSWR from "swr";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { fetcher } from "@discovery-solutions/struct";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelForm } from "@discovery-solutions/struct/client";
import {
  commercialLeadFormSchema,
  commercialLeadFields,
  CommercialLeadInterface,
} from "@/models/commercial/lead/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  IconExternalLink,
  IconMapPin,
  IconPhone,
  IconMail,
  IconWorld,
  IconBrandInstagram,
} from "@tabler/icons-react";

export default function LeadDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: lead, mutate } = useSWR<CommercialLeadInterface>(
    id ? `/api/commercial/lead/${id}` : null,
    fetcher
  );

  if (!lead) {
    return <div className="p-8 text-center text-muted-foreground">Carregando lead...</div>;
  }

  return (
    <div className="w-full pb-10">
      <SiteHeader
        heading={[
          { link: "/dashboard/leads", label: "Leads" },
          { link: `/dashboard/leads/${id}`, label: lead.name },
        ]}
      />

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA DA ESQUERDA: INFO RESUMIDA */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{lead.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={
                    lead.qualificationStatus === "qualified"
                      ? "default" // ou 'success' se tiver configurado
                      : lead.qualificationStatus === "unqualified"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {lead.qualificationStatus === "qualified"
                    ? "Qualificado"
                    : lead.qualificationStatus === "unqualified"
                    ? "Desqualificado"
                    : "Pendente"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(lead.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {lead.potentialService && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <span className="block text-xs font-medium text-muted-foreground mb-1">
                    Potencial Serviço
                  </span>
                  <span className="font-medium">{lead.potentialService}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconMapPin className="size-4 text-muted-foreground" />
                  <span>
                    {lead.address || "Endereço não informado"}
                    {lead.city && ` - ${lead.city}`}
                    {lead.state && `/${lead.state}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <IconPhone className="size-4 text-muted-foreground" />
                  <span>{lead.phone || "—"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <IconMail className="size-4 text-muted-foreground" />
                  <span className="break-all">{lead.email || "—"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <IconWorld className="size-4 text-muted-foreground" />
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Website <IconExternalLink className="size-3" />
                    </a>
                  ) : (
                    "—"
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <IconBrandInstagram className="size-4 text-muted-foreground" />
                  {lead.instagram ? (
                    <a
                      href={lead.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Instagram <IconExternalLink className="size-3" />
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DA DIREITA: TABS DE AÇÃO/EDIÇÃO */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="details">Dados do Lead</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Editar Informações</CardTitle>
                </CardHeader>
                <CardContent>
                  <ModelForm
                    endpoint={`commercial/lead/${id}`} // Usando PATCH automático do ModelForm
                    mode="edit"
                    schema={commercialLeadFormSchema}
                    fields={commercialLeadFields}
                    defaultValues={lead}
                    onSubmit={() => mutate()} // Recarrega os dados após salvar
                    buttonLabel="Salvar Alterações"
                    cols={2}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Ações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Em breve: logs de qualificação, alterações e contatos.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
