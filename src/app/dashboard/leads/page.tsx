"use client";

import { SiteHeader } from "@/components/site-header";
import {
  ModalFormProvider,
  ModalForm,
  TableView,
} from "@discovery-solutions/struct/client";

import {
  leadColumns,
  leadFields,
  leadFormSchema,
} from "@/models/commercial/lead/utils";

export default function Page() {
  return (
    <div className="w-full">
      <SiteHeader
        heading={[
          { link: "/dashboard/leads", label: "Leads" },
        ]}
      />

      <ModalFormProvider>
        {/* TABELA DE LEADS */}
        <div className="px-4">
          <TableView
            asChild
            columns={leadColumns}
            endpoint="lead"
            modalId="lead"
          />
        </div>

        {/* MODAL DE CRIAR/EDITAR */}
        <ModalForm
          schema={leadFormSchema}
          fields={leadFields}
          endpoint="lead"
          modalId="lead"
          title="Registrar/Editar Lead"
          buttonLabel="Salvar"
          cols={3}
        />
      </ModalFormProvider>
    </div>
  );
}
