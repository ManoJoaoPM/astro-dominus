"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/site-header";
import {
  editorialLineColumns,
  editorialLineFields,
  editorialLineFormSchema,
} from "@/models/socialmedia/editorial-line/utils";
import {
  ModalForm,
  ModalFormProvider,
  TableView,
} from "@discovery-solutions/struct/client";

export default function LinhaEditorialPage() {
  const [tab, setTab] = useState("linhas");
  const { clientId } = useParams() as { clientId: string };

  return (
    <Tabs onValueChange={setTab} value={tab} className="w-full">
      <SiteHeader
        heading={[
          { link: "/dashboard/clients", label: "Clientes" },
          { link: `/dashboard/clients/${clientId}`, label: "Painel do cliente" },
          { link: "#", label: "Linhas editoriais" },
        ]}
      >
        <TabsList className="grid grid-cols-1 w-fit mx-4 h-8">
          <TabsTrigger value="linhas" className="px-6 h-6 text-xs">
            Linhas editoriais
          </TabsTrigger>
        </TabsList>
      </SiteHeader>

      <ModalFormProvider>
        {/* LISTA DE LINHAS EDITORIAIS */}
        <TabsContent value="linhas" key="linhas" className="px-4">
          <TableView
            asChild
            columns={editorialLineColumns}
            endpoint="editorial-line"
            modalId="editorialLine"          // mesmo modalId do ModalForm
            queryParams={{ clientId }}       // filtra só as linhas deste cliente
          />
        </TabsContent>

        {/* MODAL DE CRIAÇÃO/EDIÇÃO */}
        <ModalForm
          schema={editorialLineFormSchema}
          fields={[
            {
              name: "clientId",
              label: "",
              type: "hidden",
              defaultValue: clientId,
            },
            ...editorialLineFields,
          ]}
          endpoint="editorial-line"
          modalId="editorialLine"            // conecta com TableView
          title="Linha editorial"
          buttonLabel="Salvar"
          cols={2}
        />
      </ModalFormProvider>
    </Tabs>
  );
}
