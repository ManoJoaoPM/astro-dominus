"use client";

import Link from "next/link";
import { TableView } from "@discovery-solutions/struct/client";
import { clientColumns } from "@/models/client/utils";
import { SiteHeader } from "@/components/site-header";
import { ClientEditModal } from "@/components/client-edit-modal";

export default function ClientsPage() {
  return (
    <div className="w-ful">
      <SiteHeader
        heading={[
          { link: "/dashboard/clientes", label: "Clientes" },
        ]}
      />

      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Clientes Dominus</h1>
            <p className="text-sm text-muted-foreground">
              Administração das imobiliárias atendidas pela Dominus Marketing.
            </p>
          </div>

          <Link
            href="clients/new"
            className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Novo cliente
          </Link>
        </div>

        <TableView
          endpoint="client"
          columns={clientColumns}
          hideAdd
          ListFooterComponent={
            <div className="text-xs text-muted-foreground">
              Selecione um cliente para gerenciar linhas editoriais, banco de ideias, pautas e planejamento mensal.
            </div>
          }
        />
      </div>
    </div>
  );
}
