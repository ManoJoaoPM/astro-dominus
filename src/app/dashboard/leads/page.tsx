"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  ModalFormProvider,
  ModalForm,
} from "@discovery-solutions/struct/client";
import { fetcher } from "@discovery-solutions/struct/client";
import useSWR from "swr";
import { Users, UserCheck, Clock, UserX } from "lucide-react";
import { CustomTableView } from "@/components/ui/custom-table-view";

import {
  commercialLeadFormSchema,
  commercialLeadColumns,
  commercialLeadFields,
} from "@/models/commercial/lead/utils";

function StatsCard({
  title,
  value,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: number;
  icon: any;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center justify-between shadow-sm">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value ?? 0}</p>
      </div>
      <div className={`p-2 rounded-full ${colorClass} bg-opacity-10`}>
        <Icon className={`h-5 w-5 ${colorClass.replace("bg-", "text-")}`} />
      </div>
    </div>
  );
}

import { useSWRConfig } from "swr";

export default function Page() {
  const { mutate } = useSWRConfig();
interface LeadStats {
  total: number;
  qualified: number;
  pending: number;
  unqualified: number;
}

const { data: stats } = useSWR<LeadStats>("/api/commercial/lead/stats", fetcher);

  return (
    <div className="w-full">
      <SiteHeader
        heading={[
          { link: "/dashboard/leads", label: "Leads" },
        ]}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total de Leads"
            value={stats?.total ?? 0}
            icon={Users}
            colorClass="bg-blue-500"
          />
          <StatsCard
            title="Qualificados"
            value={stats?.qualified ?? 0}
            icon={UserCheck}
            colorClass="bg-emerald-500"
          />
          <StatsCard
            title="Pendentes"
            value={stats?.pending ?? 0}
            icon={Clock}
            colorClass="bg-amber-500"
          />
          <StatsCard
            title="Desqualificados"
            value={stats?.unqualified ?? 0}
            icon={UserX}
            colorClass="bg-red-500"
          />
        </div>

        <ModalFormProvider>
          {/* TABELA DE LEADS */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-0 overflow-hidden">
              <CustomTableView
                columns={commercialLeadColumns}
                endpoint="commercial/lead"
                modalId="lead"
                pageSize={25}
                enableSearch={true} // Habilita a busca
                filterOptions={[
                  {
                    key: "qualificationStatus",
                    label: "Status",
                    type: "select",
                    options: [
                      { label: "Pendente", value: "pending" },
                      { label: "Qualificado", value: "qualified" },
                      { label: "Desqualificado", value: "unqualified" },
                    ],
                  },
                  {
                    key: "hasInstagram",
                    label: "Tem Instagram",
                    type: "boolean",
                  },
                  {
                    key: "city",
                    label: "Cidade",
                    type: "text",
                  },
                ]}
              />
            </div>
          </div>

          {/* MODAL DE CRIAR/EDITAR */}
          <ModalForm
            schema={commercialLeadFormSchema}
            fields={commercialLeadFields}
            endpoint="commercial/lead"
            modalId="lead"
            title="Registrar/Editar Lead"
            buttonLabel="Salvar"
            cols={3}
            onSuccess={() => {
              // Invalida todas as chaves que contenham o endpoint
              mutate(
                (key) => typeof key === "string" && key.startsWith("/api/commercial/lead"),
                undefined,
                { revalidate: true }
              );
            }}
          />
        </ModalFormProvider>
      </div>
    </div>
  );
}
